// Abonnement: prøveperiode, Stripe Checkout og webhook.
//
// Etisk gating: krevAktivtAbonnement kalles KUN fra eierens skriveruter
// (elementer/kontakter/matrise). Frigivelsesløpet, eierens nødbrems og
// etterlattevisningen er aldri portet — et dødsfall strander ikke på betaling.
import { ApiFeil } from '../http.js';
import { medBruker } from '../db.js';
import { loggRevisjon } from '../revisjon.js';
import { stripeTilgjengelig, opprettCheckout, verifiserSignatur } from '../betaling/stripe.js';

async function hentEllerOpprett(c, ctx) {
  await c.query(
    `INSERT INTO abonnementer (bruker_id) VALUES ($1)
     ON CONFLICT (bruker_id) DO NOTHING`, [ctx.brukerId]);
  return (await c.query(
    'SELECT * FROM abonnementer WHERE bruker_id = $1', [ctx.brukerId])).rows[0];
}

function erAktivtNaa(abonnement, naa = new Date()) {
  if (abonnement.status === 'aktiv') return true;
  if (abonnement.status === 'proveperiode') return new Date(abonnement.proveperiode_slutt) > naa;
  return false;
}

// Kalles fra eier-skriveruter. Kaster 402 når prøveperioden er over og intet
// abonnement er aktivt.
export async function krevAktivtAbonnement(c, ctx) {
  const abonnement = await hentEllerOpprett(c, ctx);
  if (!erAktivtNaa(abonnement)) {
    throw new ApiFeil(402, 'Prøveperioden er over — aktiver abonnementet for å gjøre endringer. Alt du har lagt inn er trygt, og frigivelse til dine nærmeste påvirkes aldri.');
  }
}

export function registrer(ruter) {
  ruter.add('GET', '/api/abonnement', ({ ctx }) => medBruker(ctx, async (c) => {
    const abonnement = await hentEllerOpprett(c, ctx);
    return { abonnement: {
      status: abonnement.status,
      aktivNaa: erAktivtNaa(abonnement),
      proveperiodeSlutt: abonnement.proveperiode_slutt,
      periodeSlutt: abonnement.periode_slutt,
      stripeKlar: stripeTilgjengelig(),
    } };
  }));

  ruter.add('POST', '/api/abonnement/checkout', async ({ ctx }) => {
    if (!stripeTilgjengelig()) throw new ApiFeil(503, 'Betaling er ikke satt opp ennå');
    const epost = await medBruker(ctx, async (c) =>
      (await c.query('SELECT epost FROM brukere WHERE id = $1', [ctx.brukerId])).rows[0]?.epost);
    const { url } = await opprettCheckout({ brukerId: ctx.brukerId, epost });
    return { url };
  });

  // Webhook fra Stripe — åpen rute, men signaturverifisert mot råkroppen.
  // Statusendringer skjer KUN her (system-rollen), aldri fra brukerens hånd.
  ruter.add('POST', '/api/stripe/webhook', async ({ body, req }) => {
    const raa = body._raa ?? '';
    if (!verifiserSignatur(raa, req.headers['stripe-signature'])) {
      throw new ApiFeil(400, 'Ugyldig signatur');
    }
    const hendelse = JSON.parse(raa);
    const objekt = hendelse.data?.object || {};

    await medBruker({ rolle: 'system' }, async (c) => {
      if (hendelse.type === 'checkout.session.completed' && objekt.client_reference_id) {
        await c.query(
          `INSERT INTO abonnementer (bruker_id, status, stripe_kunde_id, stripe_abonnement_id, oppdatert)
           VALUES ($1, 'aktiv', $2, $3, now())
           ON CONFLICT (bruker_id) DO UPDATE SET status = 'aktiv',
             stripe_kunde_id = EXCLUDED.stripe_kunde_id,
             stripe_abonnement_id = EXCLUDED.stripe_abonnement_id, oppdatert = now()`,
          [objekt.client_reference_id, objekt.customer || null, objekt.subscription || null]);
        await loggRevisjon(c, { rolle: 'system' }, null, 'abonnement_aktivert',
          { bruker_id: objekt.client_reference_id });
      } else if (hendelse.type === 'customer.subscription.updated' && objekt.id) {
        const status = objekt.status === 'active' ? 'aktiv'
          : ['past_due', 'unpaid'].includes(objekt.status) ? 'forfalt' : null;
        if (status) {
          await c.query(
            `UPDATE abonnementer SET status = $2,
               periode_slutt = to_timestamp($3), oppdatert = now()
             WHERE stripe_abonnement_id = $1`,
            [objekt.id, status, objekt.current_period_end || null]);
        }
      } else if (hendelse.type === 'customer.subscription.deleted' && objekt.id) {
        await c.query(
          `UPDATE abonnementer SET status = 'kansellert', oppdatert = now()
            WHERE stripe_abonnement_id = $1`, [objekt.id]);
      }
    });
    return { mottatt: true };
  });
}
