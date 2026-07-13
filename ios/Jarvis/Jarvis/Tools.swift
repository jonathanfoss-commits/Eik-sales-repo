import Foundation
import UserNotifications
import UIKit

/// Client-side tools JARVIS can invoke (mirrors the web app, but native:
/// timers become real local notifications that fire even when the app is closed).
enum JarvisTools {

    static let definitions: JSONValue = .array([
        .object([
            "name": .string("get_datetime"),
            "description": .string("Get the user's current local date, time and timezone. Use whenever the answer depends on the current date or time."),
            "input_schema": .object(["type": .string("object"), "properties": .object([:])]),
        ]),
        .object([
            "name": .string("get_weather"),
            "description": .string("Get current weather and a 3-day forecast. If no location is given, uses the device's GPS position."),
            "input_schema": .object([
                "type": .string("object"),
                "properties": .object([
                    "location": .object(["type": .string("string"), "description": .string("City or place name. Omit to use the user's current position.")]),
                ]),
            ]),
        ]),
        .object([
            "name": .string("set_timer"),
            "description": .string("Set a countdown timer. Delivered as a local notification with sound, and announced aloud if the app is open."),
            "input_schema": .object([
                "type": .string("object"),
                "properties": .object([
                    "seconds": .object(["type": .string("number"), "description": .string("Duration in seconds")]),
                    "label": .object(["type": .string("string"), "description": .string("Short label, e.g. 'eggene' or 'pizza'")]),
                ]),
                "required": .array([.string("seconds")]),
            ]),
        ]),
        .object([
            "name": .string("remember"),
            "description": .string("Store a lasting fact about the user (name, preferences, family, important dates). Available in all future conversations."),
            "input_schema": .object([
                "type": .string("object"),
                "properties": .object([
                    "fact": .object(["type": .string("string"), "description": .string("The fact to remember, phrased as a short statement")]),
                ]),
                "required": .array([.string("fact")]),
            ]),
        ]),
        .object([
            "name": .string("open_url"),
            "description": .string("Open a website in the user's browser."),
            "input_schema": .object([
                "type": .string("object"),
                "properties": .object([
                    "url": .object(["type": .string("string"), "description": .string("Full https:// URL to open")]),
                ]),
                "required": .array([.string("url")]),
            ]),
        ]),
    ])

    static func statusText(for name: String) -> String {
        switch name {
        case "web_search": return "Søker på nettet …"
        case "get_weather": return "Sjekker været …"
        case "get_datetime": return "Sjekker klokka …"
        case "set_timer": return "Setter timer …"
        case "remember": return "Noterer …"
        case "open_url": return "Åpner nettside …"
        default: return "Arbeider …"
        }
    }

    @MainActor
    static func execute(name: String, input: JSONValue, engine: JarvisEngine) async -> (result: String, isError: Bool) {
        do {
            switch name {
            case "get_datetime":
                let now = Date()
                let formatter = DateFormatter()
                formatter.locale = Locale(identifier: engine.languageSetting)
                formatter.dateStyle = .full
                formatter.timeStyle = .short
                let payload: JSONValue = .object([
                    "local": .string(formatter.string(from: now)),
                    "iso": .string(ISO8601DateFormatter().string(from: now)),
                    "timezone": .string(TimeZone.current.identifier),
                ])
                return (String(data: payload.encoded(), encoding: .utf8) ?? "{}", false)

            case "get_weather":
                return try await weather(input: input, engine: engine)

            case "set_timer":
                let seconds = max(1, Int(input["seconds"]?.doubleValue ?? 0))
                let label = input["label"]?.stringValue ?? "timeren"
                let center = UNUserNotificationCenter.current()
                _ = try? await center.requestAuthorization(options: [.alert, .sound])
                let content = UNMutableNotificationContent()
                content.title = "J.A.R.V.I.S."
                content.body = "Sir, \(label) er ferdig."
                content.sound = .default
                let trigger = UNTimeIntervalNotificationTrigger(timeInterval: TimeInterval(seconds), repeats: false)
                let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
                try? await center.add(request)
                // Also announce in-app if it is still open when the timer fires.
                let announce = "Sir, \(label) er ferdig."
                Task { [weak engine] in
                    try? await Task.sleep(nanoseconds: UInt64(seconds) * 1_000_000_000)
                    guard let engine else { return }
                    engine.appendMessage(role: "jarvis", text: "⏰ " + announce)
                    engine.speakIfEnabled(announce)
                }
                return ("Timer '\(label)' satt: \(seconds) sekunder. Leveres som varsel med lyd selv om appen lukkes.", false)

            case "remember":
                guard let fact = input["fact"]?.stringValue, !fact.isEmpty else { return ("Mangler 'fact'.", true) }
                engine.addMemory(fact)
                return ("Lagret.", false)

            case "open_url":
                guard let urlString = input["url"]?.stringValue,
                      urlString.lowercased().hasPrefix("https://"),
                      let url = URL(string: urlString) else { return ("Avvist: kun gyldige https-adresser.", true) }
                UIApplication.shared.open(url)
                return ("Åpnet \(urlString)", false)

            default:
                return ("Ukjent verktøy: \(name)", true)
            }
        } catch {
            return ("Verktøyfeil: \(error.localizedDescription)", true)
        }
    }

    // MARK: Weather via Open-Meteo (free, no API key)

    @MainActor
    private static func weather(input: JSONValue, engine: JarvisEngine) async throws -> (String, Bool) {
        var lat: Double
        var lon: Double
        var place: String

        if let location = input["location"]?.stringValue, !location.isEmpty {
            let langCode = engine.languageSetting.hasPrefix("nb") ? "nb" : "en"
            var comps = URLComponents(string: "https://geocoding-api.open-meteo.com/v1/search")!
            comps.queryItems = [
                URLQueryItem(name: "name", value: location),
                URLQueryItem(name: "count", value: "1"),
                URLQueryItem(name: "language", value: langCode),
            ]
            let (data, _) = try await URLSession.shared.data(from: comps.url!)
            guard let json = JSONValue.parse(data),
                  let first = json["results"]?.arrayValue?.first,
                  let la = first["latitude"]?.doubleValue,
                  let lo = first["longitude"]?.doubleValue else {
                return ("Fant ikke stedet \"\(location)\".", false)
            }
            lat = la; lon = lo
            place = (first["name"]?.stringValue ?? location)
                + (first["country"]?.stringValue.map { ", " + $0 } ?? "")
        } else {
            guard let loc = await LocationOnce().fetch() else {
                return ("Fikk ikke tilgang til posisjon. Be brukeren oppgi et stedsnavn.", false)
            }
            lat = loc.coordinate.latitude
            lon = loc.coordinate.longitude
            place = "brukerens posisjon"
        }

        var comps = URLComponents(string: "https://api.open-meteo.com/v1/forecast")!
        comps.queryItems = [
            URLQueryItem(name: "latitude", value: String(lat)),
            URLQueryItem(name: "longitude", value: String(lon)),
            URLQueryItem(name: "current", value: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code"),
            URLQueryItem(name: "daily", value: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code"),
            URLQueryItem(name: "timezone", value: "auto"),
            URLQueryItem(name: "forecast_days", value: "3"),
            URLQueryItem(name: "wind_speed_unit", value: "ms"),
        ]
        let (data, _) = try await URLSession.shared.data(from: comps.url!)
        guard var json = JSONValue.parse(data) else { return ("Klarte ikke å tolke værdata.", true) }
        json["place"] = .string(place)
        json["note"] = .string("weather_code is WMO code; wind in m/s")
        return (String(data: json.encoded(), encoding: .utf8) ?? "{}", false)
    }
}
