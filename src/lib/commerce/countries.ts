/** ISO 3166-1 alpha-2 countries offered at checkout and in shipping zones. */
export const COUNTRIES: [string, string][] = [
  ["NG", "Nigeria"], ["GH", "Ghana"], ["KE", "Kenya"], ["ZA", "South Africa"], ["EG", "Egypt"], ["RW", "Rwanda"],
  ["UG", "Uganda"], ["TZ", "Tanzania"], ["CI", "Côte d'Ivoire"], ["SN", "Senegal"], ["CM", "Cameroon"], ["MA", "Morocco"],
  ["US", "United States"], ["CA", "Canada"], ["MX", "Mexico"], ["BR", "Brazil"], ["AR", "Argentina"], ["CL", "Chile"],
  ["CO", "Colombia"], ["GB", "United Kingdom"], ["IE", "Ireland"], ["FR", "France"], ["DE", "Germany"], ["ES", "Spain"],
  ["IT", "Italy"], ["PT", "Portugal"], ["NL", "Netherlands"], ["BE", "Belgium"], ["CH", "Switzerland"], ["AT", "Austria"],
  ["SE", "Sweden"], ["NO", "Norway"], ["DK", "Denmark"], ["FI", "Finland"], ["PL", "Poland"], ["CZ", "Czechia"],
  ["GR", "Greece"], ["TR", "Türkiye"], ["AE", "United Arab Emirates"], ["SA", "Saudi Arabia"], ["QA", "Qatar"],
  ["IL", "Israel"], ["IN", "India"], ["PK", "Pakistan"], ["CN", "China"], ["HK", "Hong Kong"], ["JP", "Japan"],
  ["KR", "South Korea"], ["SG", "Singapore"], ["MY", "Malaysia"], ["TH", "Thailand"], ["PH", "Philippines"],
  ["ID", "Indonesia"], ["VN", "Vietnam"], ["AU", "Australia"], ["NZ", "New Zealand"],
];

export const COUNTRY_NAME = new Map(COUNTRIES);
