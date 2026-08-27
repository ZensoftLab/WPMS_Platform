import seedCustomers from './customer.json';

const STORAGE_KEY = 'brisk-customers';

export async function loadCustomers() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return seedCustomers;
}

export function persistCustomers(customers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  return customers;
}

export function createCustomer(form) {
  const id = Date.now().toString().slice(-5);
  return {
    customerId: `BRK-${id}`, userId: `USR-${id}`, name: form.name,
    profilePhoto: `https://i.pravatar.cc/120?u=${id}`, phone: form.phone,
    whatsapp: form.whatsapp || form.phone, email: form.email || `${form.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    address: form.address || 'Dhaka, Bangladesh', package: `${form.package} Mbps`,
    monthlyBill: Number(form.package) === 500 ? 1500 : Number(form.package) === 200 ? 1000 : 700,
    connectionStartDate: form.connectionStartDate || new Date().toISOString().slice(0, 10),
    duration: 'New customer', status: form.status || 'Active', dateOfBirth: form.dateOfBirth || '',
    area: form.area, assignedStaff: form.assignedStaff || 'Unassigned',
    referral: { code: `BRISK-RF${id}`, totalReferrals: 0, successfulReferrals: 0 },
    loyaltyHistory: [], purchaseHistory: []
  };
}

export function updateCustomer(customer, form) {
  return { ...customer, name: form.name, phone: form.phone, whatsapp: form.whatsapp || form.phone,
    email: form.email, address: form.address, package: `${form.package} Mbps`,
    monthlyBill: Number(form.package) === 500 ? 1500 : Number(form.package) === 200 ? 1000 : 700,
    connectionStartDate: form.connectionStartDate, dateOfBirth: form.dateOfBirth,
    area: form.area, assignedStaff: form.assignedStaff, status: form.status };
}
