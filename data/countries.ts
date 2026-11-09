// Source of truth for nationality, currency and PayPal availability.
//
// The eligible list is the country list PayPal publishes for Payouts
// (https://developer.paypal.com/payouts/supported-features.md). A member must be
// able to receive a payout, so only those countries are marked as supported.
// The countries we keep but cannot serve are listed at the bottom with
// paypalSupported: false, so an existing member is never locked out of the app.
export type Country = {
  code: string;
  name: string;
  currency: string;
  paypalSupported: boolean;
};

// Countries eligible for PayPal Payouts, with the currency we show for them.
// PayPal pays out in US dollars and converts for the receiver, so the local
// currency here is for display and for the volatility estimate only.
const ELIGIBLE: [code: string, name: string, currency: string][] = [
  ['AD', 'Andorra', 'EUR'],
  ['AE', 'United Arab Emirates', 'AED'],
  ['AR', 'Argentina', 'ARS'],
  ['AT', 'Austria', 'EUR'],
  ['AU', 'Australia', 'AUD'],
  ['BE', 'Belgium', 'EUR'],
  ['BG', 'Bulgaria', 'BGN'],
  ['BH', 'Bahrain', 'BHD'],
  ['BM', 'Bermuda', 'BMD'],
  ['BR', 'Brazil', 'BRL'],
  ['BS', 'Bahamas', 'BSD'],
  ['BW', 'Botswana', 'BWP'],
  ['CA', 'Canada', 'CAD'],
  ['CH', 'Switzerland', 'CHF'],
  ['CL', 'Chile', 'CLP'],
  ['CN', 'China', 'CNY'],
  ['CO', 'Colombia', 'COP'],
  ['CR', 'Costa Rica', 'CRC'],
  ['CY', 'Cyprus', 'EUR'],
  ['CZ', 'Czech Republic', 'CZK'],
  ['DE', 'Germany', 'EUR'],
  ['DK', 'Denmark', 'DKK'],
  ['DO', 'Dominican Republic', 'DOP'],
  ['EC', 'Ecuador', 'USD'],
  ['EE', 'Estonia', 'EUR'],
  ['ES', 'Spain', 'EUR'],
  ['FI', 'Finland', 'EUR'],
  ['FO', 'Faroe Islands', 'DKK'],
  ['FR', 'France', 'EUR'],
  ['GB', 'United Kingdom', 'GBP'],
  ['GE', 'Georgia', 'GEL'],
  ['GI', 'Gibraltar', 'GIP'],
  ['GL', 'Greenland', 'DKK'],
  ['GR', 'Greece', 'EUR'],
  ['GT', 'Guatemala', 'GTQ'],
  ['HK', 'Hong Kong SAR China', 'HKD'],
  ['HN', 'Honduras', 'HNL'],
  ['HR', 'Croatia', 'EUR'],
  ['HU', 'Hungary', 'HUF'],
  ['ID', 'Indonesia', 'IDR'],
  ['IE', 'Ireland', 'EUR'],
  ['IL', 'Israel', 'ILS'],
  ['IN', 'India', 'INR'],
  ['IS', 'Iceland', 'ISK'],
  ['IT', 'Italy', 'EUR'],
  ['JM', 'Jamaica', 'JMD'],
  ['JO', 'Jordan', 'JOD'],
  ['JP', 'Japan', 'JPY'],
  ['KE', 'Kenya', 'KES'],
  ['KW', 'Kuwait', 'KWD'],
  ['KY', 'Cayman Islands', 'KYD'],
  ['KZ', 'Kazakhstan', 'KZT'],
  ['LI', 'Liechtenstein', 'CHF'],
  ['LS', 'Lesotho', 'LSL'],
  ['LT', 'Lithuania', 'EUR'],
  ['LU', 'Luxembourg', 'EUR'],
  ['LV', 'Latvia', 'EUR'],
  ['MA', 'Morocco', 'MAD'],
  ['MC', 'Monaco', 'EUR'],
  ['MD', 'Moldova', 'MDL'],
  ['MT', 'Malta', 'EUR'],
  ['MU', 'Mauritius', 'MUR'],
  ['MX', 'Mexico', 'MXN'],
  ['MY', 'Malaysia', 'MYR'],
  ['MZ', 'Mozambique', 'MZN'],
  ['NL', 'Netherlands', 'EUR'],
  ['NO', 'Norway', 'NOK'],
  ['NZ', 'New Zealand', 'NZD'],
  ['NI', 'Nicaragua', 'NIO'],
  ['OM', 'Oman', 'OMR'],
  ['PA', 'Panama', 'PAB'],
  ['PE', 'Peru', 'PEN'],
  ['PH', 'Philippines', 'PHP'],
  ['PL', 'Poland', 'PLN'],
  ['PT', 'Portugal', 'EUR'],
  ['QA', 'Qatar', 'QAR'],
  ['RE', 'Réunion', 'EUR'],
  ['RO', 'Romania', 'RON'],
  ['RS', 'Serbia', 'RSD'],
  ['SE', 'Sweden', 'SEK'],
  ['SG', 'Singapore', 'SGD'],
  ['SI', 'Slovenia', 'EUR'],
  ['SK', 'Slovakia', 'EUR'],
  ['SV', 'El Salvador', 'USD'],
  ['TR', 'Türkiye', 'TRY'],
  ['US', 'United States', 'USD'],
  ['UY', 'Uruguay', 'UYU'],
  ['VE', 'Venezuela', 'VES'],
  ['VN', 'Vietnam', 'VND'],
  ['ZA', 'South Africa', 'ZAR'],
];

// Kept so members from these countries can still sign in and see their history,
// but they cannot take part in a circle because PayPal cannot pay them out.
const INELIGIBLE: [code: string, name: string, currency: string][] = [
  ['CU', 'Cuba', 'CUP'],
  ['EG', 'Egypt', 'EGP'],
  ['GH', 'Ghana', 'GHS'],
  ['IR', 'Iran', 'IRR'],
  ['KP', 'North Korea', 'KPW'],
  ['NG', 'Nigeria', 'NGN'],
  ['SD', 'Sudan', 'SDG'],
  ['SY', 'Syria', 'SYP'],
];

export const COUNTRIES: Country[] = [
  ...ELIGIBLE.map(([code, name, currency]) => ({
    code,
    name,
    currency,
    paypalSupported: true,
  })),
  ...INELIGIBLE.map(([code, name, currency]) => ({
    code,
    name,
    currency,
    paypalSupported: false,
  })),
];

export const countryByCode = (code: string): Country | undefined => {
  const normalized = code.trim().toUpperCase();
  return COUNTRIES.find((country) => country.code === normalized);
};

export const DISCLAIMER =
  'PayPal availability and exchange rates vary by country. Amounts shown are estimates; the final charge is set by PayPal at checkout.';
