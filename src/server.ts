import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

const browserDistFolder = join(import.meta.dirname, '../browser');
const dataFolder = join(browserDistFolder, 'data');

const app = express();
const angularApp = new AngularNodeAppEngine();

async function readJson<T = any>(file: string): Promise<T> {
  const filePath = join(dataFolder, file);
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function prng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generatePolygonForLocation(location: string, seed: number): string {
  const locationCoords: Record<string, [number, number]> = {
    'Delhi, India': [28.7041, 77.1025],
    'Mumbai, India': [19.0760, 72.8777],
    'Bengaluru, India': [12.9716, 77.5946],
    'Hyderabad, India': [17.3850, 78.4867],
    'Chennai, India': [13.0827, 80.2707],
    'Kolkata, India': [22.5726, 88.3639],
    'Pune, India': [18.5204, 73.8567],
    'Ahmedabad, India': [23.0225, 72.5714],
    'Jaipur, India': [26.9124, 75.7873],
    'Surat, India': [21.1458, 72.8336],
  };

  const [lat, lon] = locationCoords[location] || [28.7041, 77.1025];
  const radiusKm = 5 + (seed % 15);
  const radiusDeg = radiusKm / 111.32;

  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = lon + radiusDeg * Math.cos(angle);
    const y = lat + radiusDeg * Math.sin(angle);
    points.push([y, x]);
  }
  points.push(points[0]);

  const polygon = {
    type: 'Polygon',
    coordinates: [points],
  };

  return JSON.stringify(polygon);
}

app.get('/api/categories', async (_req, res, next) => {
  try {
    const data = await readJson('categories.json');
    return res.json(data);
  } catch (e) {
    return next(e);
  }
});

app.get('/api/service-types', async (req, res, next) => {
  try {
    const all = await readJson<any[]>('service-types.json');
    const { categoryId, categoryName } = req.query as any;
    if (categoryId) {
      return res.json(all.filter((t) => String(t.categoryId) === String(categoryId)));
    }
    if (categoryName) {
      const cats = await readJson<any[]>('categories.json');
      const cat = cats.find((c) => c.name.toLowerCase() === String(categoryName).toLowerCase());
      return res.json(cat ? all.filter((t) => t.categoryId === cat.id) : []);
    }
    return res.json(all);
  } catch (e) {
    return next(e);
  }
});

app.get('/api/providers', async (req, res, next) => {
  try {
    const all = await readJson<any[]>('providers.json');
    const { categoryId, categoryName } = req.query as any;
    if (categoryId) {
      return res.json(all.filter((p) => String(p.categoryId) === String(categoryId)));
    }
    if (categoryName) {
      const cats = await readJson<any[]>('categories.json');
      const cat = cats.find((c) => c.name.toLowerCase() === String(categoryName).toLowerCase());
      return res.json(cat ? all.filter((p) => p.categoryId === cat.id) : []);
    }
    return res.json(all);
  } catch (e) {
    return next(e);
  }
});

app.get('/api/listings', async (req, res, next) => {
  try {
    const seed = 42;
    const rng = prng(seed);
    const categories = await readJson<any[]>('categories.json');
    const types = ['Sell', 'Rent', 'Exchange', 'Service'] as const;
    const cities = [
      'Delhi, India',
      'Mumbai, India',
      'Bengaluru, India',
      'Hyderabad, India',
      'Chennai, India',
      'Kolkata, India',
      'Pune, India',
      'Ahmedabad, India',
      'Jaipur, India',
      'Surat, India',
    ];

    const baseByCat: Record<string, [number, number]> = {
      Plumbing: [299, 1499],
      Electrical: [249, 1799],
      Cleaning: [399, 2499],
      Tutoring: [199, 999],
      Carpentry: [349, 1999],
      Painting: [499, 3999],
      Moving: [999, 9999],
      'Appliance Repair': [299, 2499],
    };

    const covers: Record<string, string[]> = {
      Plumbing: [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1621905251180-97f6f10c8d1b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1605652866327-96ae58c6ba86?q=80&w=1200&auto=format&fit=crop',
      ],
      Electrical: [
        'https://images.unsplash.com/photo-1581094794329-c8112a89f11d?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop',
      ],
      Cleaning: [
        'https://images.unsplash.com/photo-1581578733145-b93f9678f53b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1581578017426-cf34aaf1ffd1?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1584622781365-6761f7d64240?q=80&w=1200&auto=format&fit=crop',
      ],
      Tutoring: [
        'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1200&auto=format&fit=crop',
      ],
      Carpentry: [
        'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519710164239-8d0a3d6a0eef?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1616628182501-3b3f34f184d5?q=80&w=1200&auto=format&fit=crop',
      ],
      Painting: [
        'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1585842378054-6bb0fd52ff7b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=1200&auto=format&fit+crop',
      ],
      Moving: [
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1585432959449-b1c11f3cba9a?q=80&w=1200&auto=format&fit=crop',
      ],
      'Appliance Repair': [
        'https://images.unsplash.com/photo-1581093588401-16c9e6d0147b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1603715749720-3bd0e8020f82?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1555617117-08fda9c09b69?q=80&w=1200&auto=format&fit=crop',
      ],
    };

    const out: any[] = [];
    let id = 1;
    const now = Date.now();
    for (const c of categories) {
      for (const typ of types) {
        for (let i = 0; i < 10; i++) {
          const coverArr = covers[c.name] || [];
          const cover = coverArr.length
            ? coverArr[i % coverArr.length]
            : 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop';
          const daysAgo = Math.floor(rng() * 120);
          const date = new Date(now - daysAgo * 86400000).toISOString().slice(0, 10);
          const location = cities[Math.floor(rng() * cities.length)];
          const [min, max] = baseByCat[c.name] || [199, 1999];
          let price = Math.round(min + rng() * (max - min));
          if (typ === 'Rent') price = Math.round(price * 0.8);
          if (typ === 'Exchange') price = Math.round(price * 0.6);
          const views = Math.floor(50 + rng() * 2000);
          const rating = 3 + Math.floor(rng() * 3);
          const verified = rng() < 0.6;
          const verifiedType = verified ? (rng() < 0.5 ? 'Company' : 'KYC') : undefined;
          const nameBase = [
            'Leak Fix',
            'Pipe Installation',
            'Bathroom Fittings',
            'Kitchen Plumbing',
          ];
          const baseName = nameBase[i % nameBase.length];
          out.push({
            id: id++,
            title: `${baseName} - ${c.name}` + (typ !== 'Service' ? ` (${typ})` : ''),
            category: c.name,
            type: typ,
            location,
            price,
            unit: typ === 'Rent' ? 'per day' : typ === 'Service' ? 'per visit' : undefined,
            cover,
            date,
            views,
            rating,
            verified,
            verifiedType,
          });
        }
      }
    }

    // Filter & paginate
    let filtered = out;
    const q = req.query as any;
    if (q.category)
      filtered = filtered.filter(
        (i) => i.category.toLowerCase() === String(q.category).toLowerCase(),
      );
    if (q.type)
      filtered = filtered.filter((i) => i.type.toLowerCase() === String(q.type).toLowerCase());
    if (q.location)
      filtered = filtered.filter((i) =>
        i.location.toLowerCase().includes(String(q.location).toLowerCase()),
      );
    if (q.minPrice) filtered = filtered.filter((i) => i.price >= Number(q.minPrice));
    if (q.maxPrice) filtered = filtered.filter((i) => i.price <= Number(q.maxPrice));
    if (q.minRating) filtered = filtered.filter((i) => i.rating >= Number(q.minRating));
    if (q.verified === 'verified') filtered = filtered.filter((i) => i.verified);
    if (q.verified === 'unverified') filtered = filtered.filter((i) => !i.verified);

    const page = Math.max(1, Number(q.page) || 1);
    const perPage = Math.max(1, Math.min(50, Number(q.perPage) || 10));
    const total = filtered.length;
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);

    return res.json({ page, perPage, total, items });
  } catch (e) {
    return next(e);
  }
});

app.get('/api/listings/:id', async (req, res, next) => {
  try {
    const id = Number(req.params['id']);
    const resp = await fetch(`${req.protocol}://${req.get('host')}/api/listings?perPage=9999`);
    const all = (await resp.json()) as any;
    const item = (all.items || []).find((x: any) => x.id === id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json(item);
  } catch (e) {
    return next(e);
  }
});

// API endpoints with proper casing for frontend
app.get('/api/Category', async (_req, res, next) => {
  try {
    const superCategories = [
      {
        id: 1,
        title: 'Household',
        colorClass: 'bg-primary',
        icon: 'bi-house',
        categories: [
          { id: 1, name: 'Plumbing', icon: 'bi-droplet', count: 120, superCategoryId: 1 },
          { id: 2, name: 'Electrical Repair', icon: 'bi-lightning', count: 85, superCategoryId: 1 },
          { id: 3, name: 'Carpentry', icon: 'bi-hammer', count: 90, superCategoryId: 1 },
          {
            id: 4,
            name: 'Painting & Whitewashing',
            icon: 'bi-palette',
            count: 75,
            superCategoryId: 1,
          },
          { id: 5, name: 'Home Cleaning', icon: 'bi-broom', count: 150, superCategoryId: 1 },
          { id: 6, name: 'Appliance Repair', icon: 'bi-tools', count: 110, superCategoryId: 1 },
          { id: 7, name: 'Pest Control', icon: 'bi-bug', count: 60, superCategoryId: 1 },
        ],
      },
      {
        id: 2,
        title: 'Office',
        colorClass: 'bg-success',
        icon: 'bi-building',
        categories: [
          {
            id: 8,
            name: 'Electrical Maintenance',
            icon: 'bi-lightning',
            count: 45,
            superCategoryId: 2,
          },
          { id: 9, name: 'HVAC', icon: 'bi-fan', count: 50, superCategoryId: 2 },
          {
            id: 10,
            name: 'Office Cleaning & Sanitization',
            icon: 'bi-broom',
            count: 80,
            superCategoryId: 2,
          },
          { id: 11, name: 'IT Support', icon: 'bi-cpu', count: 100, superCategoryId: 2 },
        ],
      },
      {
        id: 3,
        title: 'Transport',
        colorClass: 'bg-warning',
        icon: 'bi-truck',
        categories: [
          { id: 12, name: 'House Shifting', icon: 'bi-box', count: 95, superCategoryId: 3 },
          { id: 13, name: 'Office Relocation', icon: 'bi-building', count: 40, superCategoryId: 3 },
          { id: 14, name: 'Packers & Movers', icon: 'bi-archive', count: 120, superCategoryId: 3 },
          { id: 15, name: 'Vehicle Rental', icon: 'bi-car-front', count: 70, superCategoryId: 3 },
        ],
      },
      {
        id: 4,
        title: 'Personal Care',
        colorClass: 'bg-danger',
        icon: 'bi-heart',
        categories: [
          { id: 16, name: 'Salon at Home', icon: 'bi-scissors', count: 110, superCategoryId: 4 },
          {
            id: 17,
            name: 'Fitness Trainer',
            icon: 'bi-person-check',
            count: 60,
            superCategoryId: 4,
          },
          {
            id: 18,
            name: 'Spa & Massage',
            icon: 'bi-hand-thumbs-up',
            count: 75,
            superCategoryId: 4,
          },
        ],
      },
      {
        id: 5,
        title: 'Education',
        colorClass: 'bg-info',
        icon: 'bi-book',
        categories: [
          {
            id: 19,
            name: 'School Tutoring',
            icon: 'bi-mortarboard',
            count: 130,
            superCategoryId: 5,
          },
          {
            id: 20,
            name: 'Competitive Exam Coaching',
            icon: 'bi-pencil-square',
            count: 85,
            superCategoryId: 5,
          },
          { id: 21, name: 'Spoken English', icon: 'bi-chat-dots', count: 55, superCategoryId: 5 },
        ],
      },
      {
        id: 6,
        title: 'Food & Catering',
        colorClass: 'bg-secondary',
        icon: 'bi-cake2',
        categories: [
          { id: 22, name: 'Catering Services', icon: 'bi-cup-hot', count: 80, superCategoryId: 6 },
          { id: 23, name: 'Home Tiffin Service', icon: 'bi-basket', count: 60, superCategoryId: 6 },
          { id: 24, name: 'Bakery & Cake Order', icon: 'bi-cake2', count: 45, superCategoryId: 6 },
        ],
      },
    ];
    return res.json({ data: superCategories });
  } catch (e) {
    return next(e);
  }
});

app.get('/api/Listing', async (req, res, next) => {
  try {
    const seed = 42;
    const rng = prng(seed);
    const categories = await readJson<any[]>('categories.json');
    const types = ['Sell', 'Rent', 'Exchange', 'Service'] as const;
    const cities = [
      'Delhi, India',
      'Mumbai, India',
      'Bengaluru, India',
      'Hyderabad, India',
      'Chennai, India',
      'Kolkata, India',
      'Pune, India',
      'Ahmedabad, India',
      'Jaipur, India',
      'Surat, India',
    ];

    const baseByCat: Record<string, [number, number]> = {
      Plumbing: [299, 1499],
      Electrical: [249, 1799],
      Cleaning: [399, 2499],
      Tutoring: [199, 999],
      Carpentry: [349, 1999],
      Painting: [499, 3999],
      Moving: [999, 9999],
      'Appliance Repair': [299, 2499],
    };

    const covers: Record<string, string[]> = {
      Plumbing: [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1621905251180-97f6f10c8d1b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1605652866327-96ae58c6ba86?q=80&w=1200&auto=format&fit=crop',
      ],
      Electrical: [
        'https://images.unsplash.com/photo-1581094794329-c8112a89f11d?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop',
      ],
      Cleaning: [
        'https://images.unsplash.com/photo-1581578733145-b93f9678f53b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1581578017426-cf34aaf1ffd1?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1584622781365-6761f7d64240?q=80&w=1200&auto=format&fit=crop',
      ],
      Tutoring: [
        'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1200&auto=format&fit=crop',
      ],
      Carpentry: [
        'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519710164239-8d0a3d6a0eef?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1616628182501-3b3f34f184d5?q=80&w=1200&auto=format&fit=crop',
      ],
      Painting: [
        'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1585842378054-6bb0fd52ff7b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=1200&auto=format&fit+crop',
      ],
      Moving: [
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1585432959449-b1c11f3cba9a?q=80&w=1200&auto=format&fit=crop',
      ],
      'Appliance Repair': [
        'https://images.unsplash.com/photo-1581093588401-16c9e6d0147b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1603715749720-3bd0e8020f82?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1555617117-08fda9c09b69?q=80&w=1200&auto=format&fit=crop',
      ],
    };

    const out: any[] = [];
    let id = 1;
    const now = Date.now();
    for (const c of categories) {
      for (const typ of types) {
        for (let i = 0; i < 10; i++) {
          const coverArr = covers[c.name] || [];
          const cover = coverArr.length
            ? coverArr[i % coverArr.length]
            : 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop';
          const daysAgo = Math.floor(rng() * 120);
          const date = new Date(now - daysAgo * 86400000).toISOString().slice(0, 10);
          const location = cities[Math.floor(rng() * cities.length)];
          const [min, max] = baseByCat[c.name] || [199, 1999];
          let price = Math.round(min + rng() * (max - min));
          if (typ === 'Rent') price = Math.round(price * 0.8);
          if (typ === 'Exchange') price = Math.round(price * 0.6);
          const views = Math.floor(50 + rng() * 2000);
          const rating = 3 + Math.floor(rng() * 3);
          const verified = rng() < 0.6;
          const verifiedType = verified ? (rng() < 0.5 ? 'Company' : 'KYC') : undefined;
          const nameBase = [
            'Leak Fix',
            'Pipe Installation',
            'Bathroom Fittings',
            'Kitchen Plumbing',
          ];
          const baseName = nameBase[i % nameBase.length];
          out.push({
            id: id++,
            title: `${baseName} - ${c.name}` + (typ !== 'Service' ? ` (${typ})` : ''),
            category: c.name,
            type: typ,
            location,
            price,
            unit: typ === 'Rent' ? 'per day' : typ === 'Service' ? 'per visit' : undefined,
            cover,
            date,
            views,
            rating,
            verified,
            verifiedType,
          });
        }
      }
    }

    // Filter & paginate
    let filtered = out;
    const q = req.query as any;
    if (q.category)
      filtered = filtered.filter(
        (i) => i.category.toLowerCase() === String(q.category).toLowerCase(),
      );
    if (q.type)
      filtered = filtered.filter((i) => i.type.toLowerCase() === String(q.type).toLowerCase());
    if (q.location)
      filtered = filtered.filter((i) =>
        i.location.toLowerCase().includes(String(q.location).toLowerCase()),
      );
    if (q.minPrice) filtered = filtered.filter((i) => i.price >= Number(q.minPrice));
    if (q.maxPrice) filtered = filtered.filter((i) => i.price <= Number(q.maxPrice));
    if (q.minRating) filtered = filtered.filter((i) => i.rating >= Number(q.minRating));
    if (q.verified === 'verified') filtered = filtered.filter((i) => i.verified);
    if (q.verified === 'unverified') filtered = filtered.filter((i) => !i.verified);

    const page = Math.max(1, Number(q.page) || 1);
    const perPage = Math.max(1, Math.min(50, Number(q.perPage) || 10));
    const total = filtered.length;
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);

    return res.json({
      data: { page, perPage, total, items },
      status_code: 200,
      status_message: 'OK',
      message: 'OK',
    });
  } catch (e) {
    return next(e);
  }
});

app.get('/api/Listing/Details/:id', async (req, res, next) => {
  try {
    const id = Number(req.params['id']);
    const seed = 42;
    const rng = prng(seed);
    const categories = await readJson<any[]>('categories.json');
    const types = ['Sell', 'Rent', 'Exchange', 'Service'] as const;
    const cities = [
      'Delhi, India',
      'Mumbai, India',
      'Bengaluru, India',
      'Hyderabad, India',
      'Chennai, India',
      'Kolkata, India',
      'Pune, India',
      'Ahmedabad, India',
      'Jaipur, India',
      'Surat, India',
    ];

    const baseByCat: Record<string, [number, number]> = {
      Plumbing: [299, 1499],
      Electrical: [249, 1799],
      Cleaning: [399, 2499],
      Tutoring: [199, 999],
      Carpentry: [349, 1999],
      Painting: [499, 3999],
      Moving: [999, 9999],
      'Appliance Repair': [299, 2499],
    };

    const covers: Record<string, string[]> = {
      Plumbing: [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1621905251180-97f6f10c8d1b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1605652866327-96ae58c6ba86?q=80&w=1200&auto=format&fit=crop',
      ],
      Electrical: [
        'https://images.unsplash.com/photo-1581094794329-c8112a89f11d?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop',
      ],
      Cleaning: [
        'https://images.unsplash.com/photo-1581578733145-b93f9678f53b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1581578017426-cf34aaf1ffd1?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1584622781365-6761f7d64240?q=80&w=1200&auto=format&fit=crop',
      ],
      Tutoring: [
        'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1200&auto=format&fit=crop',
      ],
      Carpentry: [
        'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519710164239-8d0a3d6a0eef?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1616628182501-3b3f34f184d5?q=80&w=1200&auto=format&fit=crop',
      ],
      Painting: [
        'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1585842378054-6bb0fd52ff7b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=1200&auto=format&fit+crop',
      ],
      Moving: [
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1585432959449-b1c11f3cba9a?q=80&w=1200&auto=format&fit=crop',
      ],
      'Appliance Repair': [
        'https://images.unsplash.com/photo-1581093588401-16c9e6d0147b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1603715749720-3bd0e8020f82?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1555617117-08fda9c09b69?q=80&w=1200&auto=format&fit=crop',
      ],
    };

    let currentId = 1;
    const now = Date.now();
    for (const c of categories) {
      for (const typ of types) {
        for (let i = 0; i < 10; i++) {
          if (currentId === id) {
            const coverArr = covers[c.name] || [];
            const cover = coverArr.length
              ? coverArr[i % coverArr.length]
              : 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop';
            const daysAgo = Math.floor(rng() * 120);
            const date = new Date(now - daysAgo * 86400000).toISOString().slice(0, 10);
            const location = cities[Math.floor(rng() * cities.length)];
            const [min, max] = baseByCat[c.name] || [199, 1999];
            let price = Math.round(min + rng() * (max - min));
            if (typ === 'Rent') price = Math.round(price * 0.8);
            if (typ === 'Exchange') price = Math.round(price * 0.6);
            const views = Math.floor(50 + rng() * 2000);
            const rating = 3 + Math.floor(rng() * 3);
            const verified = rng() < 0.6;
            const verifiedType = verified ? (rng() < 0.5 ? 'Company' : 'KYC') : undefined;
            const nameBase = [
              'Leak Fix',
              'Pipe Installation',
              'Bathroom Fittings',
              'Kitchen Plumbing',
            ];
            const baseName = nameBase[i % nameBase.length];
            const title = `${baseName} - ${c.name}` + (typ !== 'Service' ? ` (${typ})` : '');

            const item = {
              id: currentId,
              title,
              category: c.name,
              type: typ,
              location,
              price,
              unit: typ === 'Rent' ? 'per day' : typ === 'Service' ? 'per visit' : undefined,
              cover,
              date,
              views,
              rating,
              verified,
              verifiedType,
              description: `Professional ${c.name.toLowerCase()} service in ${location}`,
              detailDescription: `Get the best ${c.name.toLowerCase()} service with verified professionals. Transparent pricing and quality assurance.`,
              images: [cover, ...coverArr.slice(1)],
              providerName: verified ? 'Prime Service Provider' : 'Local Provider',
              providerEmail: 'provider@example.com',
              providerPhone: '+91 98765 43210',
              providerMemberSince: new Date(2022, 0, 15).toISOString(),
              companyName:
                verified && verifiedType === 'Company' ? 'Prime Services Ltd.' : undefined,
              contactEmail: 'contact@services.com',
              contactPhone: '+91 99999 99999',
            };

            return res.json({ data: item, status_code: 200, status_message: 'OK', message: 'OK' });
          }
          currentId++;
        }
      }
    }

    return res
      .status(404)
      .json({ message: 'Listing not found', status_code: 404, status_message: 'Not Found' });
  } catch (e) {
    return next(e);
  }
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
