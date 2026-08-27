import seedCampaigns from './campaign.json';

const STORAGE_KEY = 'brisk-campaigns';
export function loadCampaigns() { const saved = localStorage.getItem(STORAGE_KEY); return Promise.resolve(saved ? JSON.parse(saved) : seedCampaigns); }
export function persistCampaigns(campaigns) { localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns)); return campaigns; }
export function audienceFor(customers, audience, filters) {
  if (audience === 'Custom segment') return customers.filter(c => (!filters.package || c.package.startsWith(filters.package)) && (!filters.area || c.area === filters.area) && (!filters.status || c.status === filters.status) && (!filters.duration || Number.parseInt(c.duration) >= Number(filters.duration)));
  const key = audience.toLowerCase();
  return customers.filter(c => {
    if (key.includes('premium')) return c.package.startsWith('500');
    if (key.includes('100 mbps')) return Number.parseInt(c.package) >= 100;
    if (key.includes('200 mbps')) return Number.parseInt(c.package) >= 200;
    if (key.includes('2+')) return Number.parseInt(c.duration) >= 2;
    if (key.includes('3+')) return Number.parseInt(c.duration) >= 3;
    if (key.includes('5+')) return Number.parseInt(c.duration) >= 5;
    if (key.includes('10+')) return Number.parseInt(c.duration) >= 10;
    if (key.includes('inactive')) return c.status === 'Inactive';
    if (key.includes('active')) return c.status === 'Active';
    if (['mirpur','uttara','dhanmondi','mohammadpur','banani','gulshan'].some(area => key.includes(area))) return c.area.toLowerCase() === key;
    return true;
  });
}
