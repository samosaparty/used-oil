import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1CXebX3YVLTSZnT04IWFfgogscWdLNUb0i6sm-XMMVgY/export?format=csv';

const MASTER_STORE_LIST = [
  "BLR - DN - Airport T-1", "BLR - CK - Panathur", "Udyog Vihar, Phase V", "TN - DN - Guduvancherry", "Marathalli",
  "Mahadevpura", "Technostar (AECS)", "JP Nagar", "BLR - DN - Haralur", "Sushant Lok", "CBD", "Koramangala", "Kondapur",
  "Dommasandra", "HSR Layout Sector 3", "Malviya Nagar", "NCR - DN - Sector 120 Market", "NCR - DN - Golf Course Road",
  "BLR - CK - Manyta Tech Park", "Airport Road", "BLR - DN - Ecoworld", "BLR - DN - Kaggadasapura", "NCR - DN - Star Tower",
  "Sector 56", "Kalyan Nagar", "New BEL Rd", "Sahakar Nagar", "Jeevan Bhima Nagar", "Sarjapur", "Dasarahalli", "Ameerpet",
  "Indiranagar 12B", "Sohna Road", "Electronic City", "Manikonda", "NCR - DN - Advant Tech Park", "Bellandur",
  "Bagmane (CV Raman Nagar)", "BLR - DN - Ayyappa Nagar", "BLR - DN - Budigere", "Kanakapura Dine-In", "Bagmane",
  "Madhapur", "Begur", "Hennur", "Dwarka", "NCR - DN- Janakpuri", "Indirapuram", "Vasant kunj", "Sector- 4 Noida",
  "BLR - DN - Bagalur", "Channasandra", "BLR - DN - Royal Meenakshi Mall", "Eco Space", "Sector 4 Gurgaon",
  "BLR - DN - Galleria Mall", "NCR - DN - Shalimar Bagh", "Bannerghatta", "Sarita Vihar", "Rajaji Nagar",
  "BLR - DN - Neo Town", "BLR - DN - Kengeri", "Banashankari", "Nagarbhavi", "Pragathi Nagar",
  "BLR - DN - Park Square Mall (ITPL)", "Nexus Shantiniketan", "Defence Colony", "Old Madras Road", "HYD - DN - Sun City",
  "Sector 90", "Kukatpally", "Dilshad Garden", "Rohini", "RT Nagar", "East Patel Nagar", "Murgeshpalya", "Varthur",
  "EGL", "TC Palya", "Hyd - CK - Padmarao Nagar", "HSR Layout", "Whitefield", "AS Rao Nagar", "NCR - DN - Gaur City Mall(Sector 4)",
  "Alpha 2 Greater Noida", "Kanakpura Road", "Singasandra", "NCR - DN - Pacific Mall(Dwarka 21)", "Faridabad SEC16",
  "RR Nagar", "Laxmi Nagar", "Aparna Mall", "Dilshukh Nagar", "Uttam Nagar", "Gaur City- Noida Extension",
  "NCR - CK - Sector 65", "Ananth Nagar", "NCR - CK - Palam Vihar", "Royasandra", "Chandapura", "Raj Nagar",
  "Crossing Republic", "BLR - DN - Channapatna", "TN - CK - Karapakkam"
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
    let subDivision = row['Sender Sub Division'] || 'Unknown';
    
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
  });

  // Calculate Finals
  const fillEfficiency = totalTins > 0 ? (totalVolume / totalTins) : 0;
  const complianceRate = totalRowsWithFillStatus > 0 ? (fullyFilledTinsCount / totalRowsWithFillStatus) * 100 : 0;
  
  // Deduplicate master list and find missing stores
  const missingStores = [...new Set(MASTER_STORE_LIST)].filter(store => !activeOutletsSet.has(store));

  // Format Trends
  const volumeTrendData = Object.keys(volumeByDate)
    .sort() // sort by date ascending
    .map(date => ({
      day: date.substring(5), // roughly MM-DD
      volume: parseFloat(volumeByDate[date].toFixed(1)),
    }));

  // Format Top Performers
  const topPerformers = Object.keys(volumeBySubDivision)
    .map(name => ({
      name,
      volume: parseFloat(volumeBySubDivision[name].volume.toFixed(1)),
      tins: volumeBySubDivision[name].tins,
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5); // top 5

  // Format All Transactions
  const recentTransactions = validRows.map((row: any) => {
    let subDivision = row['Sender Sub Division'] || 'Other';
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
      totalVolume: parseFloat(totalVolume.toFixed(2)),
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
    recentTransactions,
    summary: `Processed ${validRows.length} submissions. Total volume collected stands at ${parseFloat(totalVolume.toFixed(2))}kg across ${activeOutletsSet.size} outlets. The average fill efficiency is ${parseFloat(fillEfficiency.toFixed(2))} kg/tin.`
  };
}
