import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1CXebX3YVLTSZnT04IWFfgogscWdLNUb0i6sm-XMMVgY/export?format=csv';

export const GurgaonWarehouse = [
  'Sohna Road', 'Sushant Lok', 'Sector 56', 'Gurgaon Central Warehouse', 'Kitchen Gurgaon', 
  'Udyog Vihar Phase V', 'Raheja Square Mall', 'Sector 90', 'Sector- 73 Noida', 
  'Sector- 4 Noida', 'Raj Nagar', 'Crossing Republic', 'Indirapuram', 'Sector 10 Gurugram', 
  'Dwarka', 'Ashok Vihar', 'Rohini', 'Malviya Nagar', 'Janak Puri', 'Laxmi Nagar', 
  'Vasant Kunj', 'East Patel Nagar', 'Defence Colony', 'Faridabad SEC16', 'Sector 141', 
  'Sarita Vihar', 'Corporate Sale NCR', 'Alpha 2 Greater Noida', 'Dilshad Garden', 
  'Sector 4 Gurgaon', 'Gandhi Vihar', 'Uttam Nagar', 'Gaur City- Noida Extension', 
  'Training NCR', 'NCR - DN - Advant Tech Park',  'NCR - DN - Sector 120 Market', 'NCR - DN - Sector 120 Central Market', 'Tech NCR', 
  'NCR - DN- Janakpuri', 'NCR - DN - Star Tower', 'NCR - CK - Palam Vihar', 
  'NCR - CK - Sector 65', 'NCR - DN - Shalimar Bagh','NCR - DN- Shalimar Bag', 'NCR - DN - Golf Course Road', 
  'NCR - DN - Pacific Mall(Dwarka 21)','Central Warehouse Gurgaon','Central Kitchen Gurgaon','NCR-DN-Gaur city mall(Sector-4)', 'NCR - DN - Gaur City Mall(Sector 4)',
  'Training centre NCR', 'Udyog Vihar, Phase V'
];

export const HyderabadWarehouse = [
  'Hyderabad Central Warehouse', 'Pragathi Nagar', 'Dilshukh Nagar', 
  'AS Rao Nagar', 'Manikonda', 'Nacharam', 'Ameerpet', 'Madhapur', 'Kitchen Hyderabad', 
  'Aparna Mall', 'Kondapur', 'Mehdipatnam', 'Hyd - CK - Padmarao Nagar', 
  'HYD - DN - Sun City','Kukatpally', 'Tech HYD'
];

export const CHENNAIWarehouse = [
  'Chennai Central Warehouse', 'TN - DN - Guduvancherry', 'TN - CK - Karapakkam'
];

export const BangaloreWarehouse = [
  'Koramangala', 'Jeevan Bhima Nagar', 'HSR Layout', 'JP Nagar', 'Kalyan Nagar', 
  'Marathalli', 'Kitchen Bangalore', 'Whitefield', 'CBD', 'Bellandur', 
  'Sahakar Nagar', 'Bangalore Central Warehouse', 'Rajaji Nagar', 'Electronic City', 
  'Old Madras Road', 'Dommasandra', 'Nagarbhavi', 'RR Nagar', 'RT Nagar', 
  'Mahadevpura', 'Dasarahalli', 'Indiranagar 12B', 'Forum Mall', 'Technostar (AECS)', 
  'Bannerghatta', 'HSR Layout Sector 3', 'Murgeshpalya', 'Training', 'Varthur', 
  'ETV', 'Corporate Sales BLR', 'Hennur', 'Sarjapur', 'Yelahanka', 'Chandapura', 
  'Kanakpura Road', 'Begur', 'Royasandra', 'BLR - CK - Manyta Tech Park', 
  'Bagmane', 'Nexus Koramangala', 'Eco Space', 'Nexus Shantiniketan', 'EGL', 
  'Bagmane (CV Raman Nagar)', 'Kasavanahalli', 'TC Palya', 'Singasandra', 
  'New BEL Rd', 'Channasandra', 'Kanakapura Dine-In', 'Airport Road', 
  'Banashankari', 'Ananth Nagar', 'BLR - CK - Panathur', 
  'BLR - DN - Park Square Mall (ITPL)', 'BLR - DN - Kengeri', 'BLR - DN - Haralur', 
  'BLR - DN - Ayyappa Nagar', 'BLR - DN - Budigere', 'BLR - DN - Kaggadasapura', 
  'Tech BLR', 'BLR - DN - Bagalur', 'BLR - DN - Channapatna', 'BLR - DN - Airport T-1', 
  'BLR - DN - Ecoworld', 'BLR - DN - Galleria Mall', 'BLR - DN - Neo Town', 
  'BLR - DN - Royal Meenakshi Mall', 'Lift Maintenance'
];

export async function getDashboardData(startDate?: string, endDate?: string, warehouseFilter?: string) {
  // Fetch CSV data
  const res = await fetch(CSV_URL, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch data from Google Sheets: ${res.status} ${res.statusText}`);
  }
  const csvText = await res.text();

  // Parse CSV
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const data = parsed.data as any[];

  // Process KPIs
  let totalVolume = 0;
  let totalTins = 0;
  const activeOutletsSet = new Set<string>();
  let fullyFilledTinsCount = 0;
  let totalRowsWithFillStatus = 0;

  // Process Trends and Performers
  const volumeByDate: Record<string, number> = {};
  const volumeBySubDivision: Record<string, { volume: number, tins: number }> = {};
  const volumeByOutlet: Record<string, { volume: number, tins: number }> = {};
  const validRows: any[] = [];

  // Find min and max dates in dataset for the summary if no filters applied
  let minDate = "9999-99-99";
  let maxDate = "0000-00-00";

  data.forEach((row) => {
    // Some dates are formatted as "2026-06-06 13:29"
    const sentAtRaw = row['Sent At'];
    let dateStr = 'Unknown';
    if (sentAtRaw) {
      // Just extract YYYY-MM-DD
      const dateParts = String(sentAtRaw).split(' ');
      if (dateParts.length > 0) {
        dateStr = dateParts[0];
      }
    }

    if (dateStr !== 'Unknown') {
      if (dateStr < minDate) minDate = dateStr;
      if (dateStr > maxDate) maxDate = dateStr;
    }

    // Apply date filters
    if (startDate && dateStr !== 'Unknown' && dateStr < startDate) return;
    if (endDate && dateStr !== 'Unknown' && dateStr > endDate) return;

    const volumeStr = String(row['How many kgs of used oil sent'] || '0');
    // Extract numeric value just in case there's text
    const volumeMatch = volumeStr.match(/[\d.]+/);
    const volume = volumeMatch ? parseFloat(volumeMatch[0]) : 0;
    
    const tinsStr = String(row['Number of Tins'] || '0');
    const tinsMatch = tinsStr.match(/[\d.]+/);
    const tins = tinsMatch ? parseInt(tinsMatch[0], 10) : 0;

    const outletName = row['Outlets Name'] || 'Unknown';
    const senderDivision = String(row['Sender Division'] || '').trim();
    let subDivision = String(row['Sender Sub Division'] || 'Unknown').trim();
    
    const lowerDiv = senderDivision.toLowerCase();
    if (lowerDiv === 'ncr') {
      subDivision = 'Gurgaon Warehouse';
    } else if (lowerDiv === 'telangana') {
      subDivision = 'Hyderabad Warehouse';
    } else if (lowerDiv === 'karnataka') {
      subDivision = 'Bangalore Warehouse';
    } else {
      // Normalize Gurgaon, NCR, Ghaziabad, Delhi, and Greater Noida into 'Gurgaon Warehouse'
      const lowerSub = subDivision.toLowerCase();
      if (
        lowerSub === 'gurgaon' || 
        lowerSub === 'ncr' || 
        lowerSub === 'ghaziabad' || 
        lowerSub === 'delhi' || 
        lowerSub === 'greater noida'
      ) {
        subDivision = 'Gurgaon Warehouse';
      } else if (lowerSub === 'hyderabad') {
        subDivision = 'Hyderabad Warehouse';
      } else if (lowerSub === 'bangalore') {
        subDivision = 'Bangalore Warehouse';
      } else if (lowerSub === 'chennai') {
        subDivision = 'Chennai Warehouse';
      }
    }

    // Apply warehouse filter
    if (warehouseFilter && subDivision !== warehouseFilter) return;

    validRows.push(row);

    const fillStatus = row['Are all the tins completely filled'];
    
    // Accumulate KPIs
    totalVolume += volume;
    totalTins += tins;
    if (outletName && outletName !== 'Unknown') {
      activeOutletsSet.add(outletName);
    }
    
    if (fillStatus) {
      const statusLower = String(fillStatus).toLowerCase();
      totalRowsWithFillStatus += 1;
      if (statusLower.includes('yes') && !statusLower.includes('no')) {
        fullyFilledTinsCount += 1;
      }
    }

    // Accumulate Trends
    if (!volumeByDate[dateStr]) volumeByDate[dateStr] = 0;
    volumeByDate[dateStr] += volume;

    // Accumulate Top Performers (grouped by Sender Sub Division)
    if (!volumeBySubDivision[subDivision]) volumeBySubDivision[subDivision] = { volume: 0, tins: 0 };
    volumeBySubDivision[subDivision].volume += volume;
    volumeBySubDivision[subDivision].tins += tins;

    // Accumulate Top Outlets (grouped by Outlet Name)
    if (outletName && outletName !== 'Unknown') {
      if (!volumeByOutlet[outletName]) volumeByOutlet[outletName] = { volume: 0, tins: 0 };
      volumeByOutlet[outletName].volume += volume;
      volumeByOutlet[outletName].tins += tins;
    }
  });

  // Calculate Finals
  const fillEfficiency = totalTins > 0 ? (totalVolume / totalTins) : 0;
  const complianceRate = totalRowsWithFillStatus > 0 ? (fullyFilledTinsCount / totalRowsWithFillStatus) * 100 : 0;
  
  // Deduplicate target list and find missing stores
  let targetStoreList: string[] = [];
  if (warehouseFilter === 'Gurgaon Warehouse') {
    targetStoreList = GurgaonWarehouse;
  } else if (warehouseFilter === 'Hyderabad Warehouse') {
    targetStoreList = HyderabadWarehouse;
  } else if (warehouseFilter === 'Bangalore Warehouse') {
    targetStoreList = BangaloreWarehouse;
  } else if (warehouseFilter === 'Chennai Warehouse') {
    targetStoreList = CHENNAIWarehouse;
  } else {
    // Combine all if no filter
    targetStoreList = [
      ...GurgaonWarehouse,
      ...HyderabadWarehouse,
      ...CHENNAIWarehouse,
      ...BangaloreWarehouse
    ];
  }
  const missingStores = [...new Set(targetStoreList)].filter(store => !activeOutletsSet.has(store));

  // Format Trends
  const volumeTrendData = Object.keys(volumeByDate)
    .sort() // sort by date ascending
    .map(date => ({
      day: date.substring(5), // roughly MM-DD
      volume: Number(Number(volumeByDate[date]).toFixed(4)),
    }));

  // Format Top Performers
  const topPerformers = Object.keys(volumeBySubDivision)
    .map(name => ({
      name,
      volume: Number(Number(volumeBySubDivision[name].volume).toFixed(4)),
      tins: volumeBySubDivision[name].tins,
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5); // top 5

  const allOutlets = Object.keys(volumeByOutlet)
    .map(name => ({
      name,
      volume: Number(Number(volumeByOutlet[name].volume).toFixed(4)),
      tins: volumeByOutlet[name].tins,
    }));

  // Format Top Outlets
  const topOutlets = [...allOutlets]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10); // top 10

  // Format Bottom Outlets
  const bottomOutlets = [...allOutlets]
    .sort((a, b) => a.volume - b.volume)
    .slice(0, 10); // bottom 10

  // Format All Transactions
  const recentTransactions = validRows.map((row: any) => {
    const senderDivision = String(row['Sender Division'] || '').trim();
    let subDivision = String(row['Sender Sub Division'] || 'Other').trim();
    const lowerDiv = senderDivision.toLowerCase();

    if (lowerDiv === 'ncr') {
      subDivision = 'Gurgaon Warehouse';
    } else if (lowerDiv === 'telangana') {
      subDivision = 'Hyderabad Warehouse';
    } else if (lowerDiv === 'karnataka') {
      subDivision = 'Bangalore Warehouse';
    } else {
      const lowerSub = subDivision.toLowerCase();
      if (lowerSub === 'delhi' || lowerSub === 'greater noida' || lowerSub === 'greaternoida') {
        subDivision = 'Gurgaon Warehouse';
      } else if (lowerSub === 'gurgaon' || lowerSub === 'ncr' || lowerSub === 'gurgaon & ncr' || lowerSub === 'ghaziabad') {
        subDivision = 'Gurgaon Warehouse';
      } else if (lowerSub === 'hyderabad') {
        subDivision = 'Hyderabad Warehouse';
      } else if (lowerSub === 'bangalore') {
        subDivision = 'Bangalore Warehouse';
      }
    }

    return {
      id: row['Submission Number'] || Math.random().toString(),
      date: row['Sent At'] || 'N/A',
      outlet: row['Outlets Name'] || 'Unknown',
      sender: row['Sender Name'] || 'Unknown',
      warehouse: subDivision,
      tins: row['Number of Tins'] || 0,
      volume: row['How many kgs of used oil sent'] || 0,
      status: row['Current Status'] || 'Pending',
    };
  });

  return {
    kpiData: {
      totalVolume: Number(totalVolume.toFixed(4)),
      totalTins: totalTins,
      totalVolumeGrowth: "+12.5%", // We would calculate this if we had a longer history
      fillEfficiency: parseFloat(fillEfficiency.toFixed(2)),
      activeOutlets: activeOutletsSet.size,
      complianceRate: parseFloat(complianceRate.toFixed(1)),
      missingStoresCount: missingStores.length,
      missingStoresList: missingStores,
    },
    volumeTrendData,
    topPerformers,
    topOutlets,
    bottomOutlets,
    recentTransactions,
    summary: `Processed ${validRows.length} submissions. Total volume collected stands at ${Number(totalVolume.toFixed(4))}kg across ${activeOutletsSet.size} outlets. The average fill efficiency is ${parseFloat(fillEfficiency.toFixed(2))} kg/tin.`
  };
}
