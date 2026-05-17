const xlsx = require('xlsx');

const workbook = xlsx.readFile('RB DSA sheet.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log(data[0]); // Header row
console.log(data[1]); // First data row
