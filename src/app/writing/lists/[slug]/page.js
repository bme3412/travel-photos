'use client';

import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { lists } from '../../components/listsData';

// Function to get country code from location name
const getCountryCode = (location) => {
    const countryMap = {
        // Asia
        'Afghanistan': 'AF',
        'Armenia': 'AM',
        'Azerbaijan': 'AZ',
        'Bahrain': 'BH',
        'Bangladesh': 'BD',
        'Bhutan': 'BT',
        'Brunei': 'BN',
        'Cambodia': 'KH',
        'China': 'CN',
        'Cyprus': 'CY',
        'Georgia': 'GE',
        'India': 'IN',
        'Indonesia': 'ID',
        'Iran': 'IR',
        'Iraq': 'IQ',
        'Israel': 'IL',
        'Japan': 'JP',
        'Jordan': 'JO',
        'Kazakhstan': 'KZ',
        'Kuwait': 'KW',
        'Laos': 'LA',
        'Lebanon': 'LB',
        'Malaysia': 'MY',
        'Maldives': 'MV',
        'Mongolia': 'MN',
        'Myanmar': 'MM',
        'Nepal': 'NP',
        'North Korea': 'KP',
        'Oman': 'OM',
        'Pakistan': 'PK',
        'Philippines': 'PH',
        'Qatar': 'QA',
        'Saudi Arabia': 'SA',
        'Singapore': 'SG',
        'South Korea': 'KR',
        'Sri Lanka': 'LK',
        'Syria': 'SY',
        'Taiwan': 'TW',
        'Thailand': 'TH',
        'Timor-Leste': 'TL',
        'Turkey': 'TR',
        'Turkmenistan': 'TM',
        'United Arab Emirates': 'AE',
        'Uzbekistan': 'UZ',
        'Vietnam': 'VN',
        'Yemen': 'YE',
      
        // Europe
        'Albania': 'AL',
        'Andorra': 'AD',
        'Austria': 'AT',
        'Belarus': 'BY',
        'Belgium': 'BE',
        'Bosnia and Herzegovina': 'BA',
        'Bulgaria': 'BG',
        'Croatia': 'HR',
        'Czech Republic': 'CZ',
        'Denmark': 'DK',
        'Estonia': 'EE',
        'Finland': 'FI',
        'France': 'FR',
        'Germany': 'DE',
        'Greece': 'GR',
        'Hungary': 'HU',
        'Iceland': 'IS',
        'Ireland': 'IE',
        'Italy': 'IT',
        'Latvia': 'LV',
        'Liechtenstein': 'LI',
        'Lithuania': 'LT',
        'Luxembourg': 'LU',
        'Malta': 'MT',
        'Moldova': 'MD',
        'Monaco': 'MC',
        'Montenegro': 'ME',
        'Netherlands': 'NL',
        'North Macedonia': 'MK',
        'Norway': 'NO',
        'Poland': 'PL',
        'Portugal': 'PT',
        'Romania': 'RO',
        'Russia': 'RU',
        'San Marino': 'SM',
        'Serbia': 'RS',
        'Slovakia': 'SK',
        'Slovenia': 'SI',
        'Spain': 'ES',
        'Sweden': 'SE',
        'Switzerland': 'CH',
        'Ukraine': 'UA',
        'United Kingdom': 'GB',
        'Scotland': 'GB', // Note: Scotland is part of the United Kingdom (GB)
        'Wales': 'GB',
        'Northern Ireland': 'GB',
      
        // Africa
        'Algeria': 'DZ',
        'Angola': 'AO',
        'Benin': 'BJ',
        'Botswana': 'BW',
        'Burkina Faso': 'BF',
        'Burundi': 'BI',
        'Cabo Verde': 'CV',
        'Cameroon': 'CM',
        'Central African Republic': 'CF',
        'Chad': 'TD',
        'Comoros': 'KM',
        'Democratic Republic of the Congo': 'CD',
        'Republic of the Congo': 'CG',
        'Djibouti': 'DJ',
        'Egypt': 'EG',
        'Equatorial Guinea': 'GQ',
        'Eritrea': 'ER',
        'Eswatini': 'SZ',
        'Ethiopia': 'ET',
        'Gabon': 'GA',
        'Gambia': 'GM',
        'Ghana': 'GH',
        'Guinea': 'GN',
        'Guinea-Bissau': 'GW',
        'Ivory Coast': 'CI',
        'Kenya': 'KE',
        'Lesotho': 'LS',
        'Liberia': 'LR',
        'Libya': 'LY',
        'Madagascar': 'MG',
        'Malawi': 'MW',
        'Mali': 'ML',
        'Mauritania': 'MR',
        'Mauritius': 'MU',
        'Morocco': 'MA',
        'Mozambique': 'MZ',
        'Namibia': 'NA',
        'Niger': 'NE',
        'Nigeria': 'NG',
        'Rwanda': 'RW',
        'Sao Tome and Principe': 'ST',
        'Senegal': 'SN',
        'Seychelles': 'SC',
        'Sierra Leone': 'SL',
        'Somalia': 'SO',
        'South Africa': 'ZA',
        'South Sudan': 'SS',
        'Sudan': 'SD',
        'Tanzania': 'TZ',
        'Togo': 'TG',
        'Tunisia': 'TN',
        'Uganda': 'UG',
        'Zambia': 'ZM',
        'Zimbabwe': 'ZW',
      
        // North America
        'Antigua and Barbuda': 'AG',
        'Bahamas': 'BS',
        'Barbados': 'BB',
        'Belize': 'BZ',
        'Canada': 'CA',
        'Costa Rica': 'CR',
        'Cuba': 'CU',
        'Dominica': 'DM',
        'Dominican Republic': 'DO',
        'El Salvador': 'SV',
        'Grenada': 'GD',
        'Guatemala': 'GT',
        'Haiti': 'HT',
        'Honduras': 'HN',
        'Jamaica': 'JM',
        'Mexico': 'MX',
        'Nicaragua': 'NI',
        'Panama': 'PA',
        'Saint Kitts and Nevis': 'KN',
        'Saint Lucia': 'LC',
        'Saint Vincent and the Grenadines': 'VC',
        'Trinidad and Tobago': 'TT',
        'United States of America': 'US',
        'USA': 'US',
      
        // South America
        'Argentina': 'AR',
        'Bolivia': 'BO',
        'Brazil': 'BR',
        'Chile': 'CL',
        'Colombia': 'CO',
        'Ecuador': 'EC',
        'Guyana': 'GY',
        'Paraguay': 'PY',
        'Peru': 'PE',
        'Suriname': 'SR',
        'Uruguay': 'UY',
        'Venezuela': 'VE',
      
        // Oceania
        'Australia': 'AU',
        'Fiji': 'FJ',
        'Kiribati': 'KI',
        'Marshall Islands': 'MH',
        'Micronesia': 'FM',
        'Nauru': 'NR',
        'New Zealand': 'NZ',
        'Palau': 'PW',
        'Papua New Guinea': 'PG',
        'Samoa': 'WS',
        'Solomon Islands': 'SB',
        'Tonga': 'TO',
        'Tuvalu': 'TV',
        'Vanuatu': 'VU',
      
        // Miscellaneous Territories
        'Hong Kong': 'HK',
        'Macau': 'MO',
        'Puerto Rico': 'PR',
        'Greenland': 'GL',
        'Bermuda': 'BM',
        'Cayman Islands': 'KY',
        'Gibraltar': 'GI',
        'Isle of Man': 'IM',
        'Jersey': 'JE',
        'Liechtenstein': 'LI',
        'Montserrat': 'MS',
        'Northern Mariana Islands': 'MP',
        'Saint Helena': 'SH',
        'Turks and Caicos Islands': 'TC',
        'United States Virgin Islands': 'VI',
        'Wallis and Futuna': 'WF',
      };

  // Look for country name in the location string
  for (const [country, code] of Object.entries(countryMap)) {
    if (location.includes(country)) {
      return code;
    }
  }
  return null;
};

// Function to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};

// Function to extract location from title
const getLocationFromTitle = (title) => {
  const parts = title.split(', ');
  return parts[parts.length - 1];
};

export default function ListDetailPage({ params }) {
  const resolvedParams = React.use(params);
  const list = lists.find(list => list.slug === resolvedParams.slug);
  
  if (!list) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6 py-12">
        {/* Back Navigation */}
        <Link 
          href="/writing"
          className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-8 group font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Writing
        </Link>

        {/* Header */}
        <div className="max-w-4xl mb-12">
          <h1 className="text-6xl font-extrabold text-gray-900 mb-4">{list.title}</h1>
          {list.description && (
            <p className="text-xl text-gray-600">{list.description}</p>
          )}
        </div>
        
        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {list.items.map((item, index) => {
            const location = getLocationFromTitle(item.title);
            const countryCode = getCountryCode(location);
            const flag = getFlagEmoji(countryCode);

            return (
              <div 
                key={index}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-8 group"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                    {item.title}
                  </h3>
                  {flag && (
                    <span className="text-2xl" title={location}>
                      {flag}
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-2 text-gray-500 mb-6">
                  <MapPin className="h-4 w-4 mt-1 text-teal-600" />
                  <span>{location}</span>
                </div>

                <p className="text-gray-600 mb-6">
                  {item.description}
                </p>

                {item.details && (
                  <ul className="space-y-3 border-t border-gray-100 pt-6">
                    {item.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <span className="text-teal-600 mt-1.5 text-lg">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}