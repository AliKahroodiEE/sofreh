/**
 * Demo data for Sofreh: cuisines, 8 restaurants with menus and photos, users,
 * a week of orders (so the dashboard has charts), reviews and discount codes.
 *
 *   npm run db:seed        (runs with Node's built-in TypeScript support)
 *
 * Re-running wipes the existing data first. Random values come from a seeded
 * generator, so every run produces the same dataset.
 */
import { PrismaClient, type OrderStatus, type PaymentMethod } from '@prisma/client';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();
const here = dirname(fileURLToPath(import.meta.url));
const IMAGES = join(here, 'seed-images');
const UPLOADS = join(here, '..', 'uploads');

// ---------------------------------------------------------------- helpers

let state = 20261025;
/** Deterministic pseudo-random number in [0, 1). */
const rand = () => ((state = (state * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = <T>(list: T[]): T => list[Math.floor(rand() * list.length)];
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

/** Copy a seed photo into uploads/ and return its public path. */
function photo(slug: string | undefined) {
  if (!slug) return null;
  const file = `seed-${slug}.webp`;
  copyFileSync(join(IMAGES, `${slug}.webp`), join(UPLOADS, file));
  return `/uploads/${file}`;
}

// ------------------------------------------------------------------- data

const cuisines = [
  { slug: 'iranian', name: 'ایرانی', icon: 'iranian' },
  { slug: 'fastfood', name: 'فست‌فود', icon: 'burger' },
  { slug: 'pizza', name: 'پیتزا', icon: 'pizza' },
  { slug: 'cafe', name: 'کافه', icon: 'coffee' },
  { slug: 'dessert', name: 'شیرینی و دسر', icon: 'cake' },
  { slug: 'salad', name: 'سالاد و سالم', icon: 'salad' },
  { slug: 'breakfast', name: 'صبحانه', icon: 'breakfast' },
  { slug: 'seafood', name: 'دریایی', icon: 'fish' },
];

type Dish = [name: string, description: string, price: number, image?: string, discountPercent?: number, isAvailable?: boolean];

const restaurants: {
  slug: string;
  name: string;
  description: string;
  cover: string;
  address: string;
  cuisines: string[];
  deliveryFee: number;
  minOrder: number;
  time: [number, number];
  isOpen?: boolean;
  menu: Record<string, Dish[]>;
}[] = [
  {
    slug: 'atashkadeh',
    name: 'کبابسرای آتشکده',
    description: 'کباب‌های زغالی با گوشت تازه‌ی گوسفندی و برنج ایرانی دودی.',
    cover: 'kebab-grill',
    address: 'تهران، خیابان شریعتی، بالاتر از پل رومی',
    cuisines: ['iranian'],
    deliveryFee: 25000,
    minOrder: 200000,
    time: [35, 50],
    menu: {
      'کباب‌ها': [
        ['کباب کوبیده', 'دو سیخ کوبیده‌ی گوسفندی، برنج ایرانی، گوجه‌ی کبابی', 420000, 'kebab-koobideh'],
        ['جوجه‌کباب', 'سینه‌ی مرغ زعفرانی، برنج، گوجه‌ی کبابی', 395000, 'joojeh-kebab', 10],
        ['کباب برگ', 'فیله‌ی گوسفندی، برنج ایرانی، کره', 690000],
      ],
      'خورش و پلو': [
        ['قورمه‌سبزی', 'خورش سبزی با گوشت گوسفندی و لوبیا قرمز، با برنج', 320000],
        ['ماهی سرخ‌شده با پلو زعفرانی', 'ماهی جنوبی سرخ‌شده، پلو زعفرانی، سبزی', 480000, 'fish-saffron-rice'],
      ],
      'پیش‌غذا و نوشیدنی': [
        ['سالاد شیرازی', 'گوجه، خیار، پیاز و آبغوره', 65000, 'shirazi-salad'],
        ['ماست و خیار', 'ماست چکیده با خیار و نعناع خشک', 55000],
        ['دوغ محلی', 'دوغ گازدار با پونه', 35000],
      ],
    },
  },
  {
    slug: 'napoli-no',
    name: 'پیتزا ناپل‌نو',
    description: 'پیتزای ناپلی با خمیر ۴۸ساعته و تنور هیزمی.',
    cover: 'pizza-cover',
    address: 'تهران، سعادت‌آباد، میدان کاج',
    cuisines: ['pizza', 'fastfood'],
    deliveryFee: 30000,
    minOrder: 250000,
    time: [30, 45],
    menu: {
      'پیتزاها': [
        ['پیتزا مارگاریتا', 'سس گوجه‌ی دست‌ساز، موتزارلا، ریحان تازه', 340000, 'pizza-margherita'],
        ['پیتزا پپرونی', 'پپرونی تند، موتزارلا، سس گوجه', 395000, 'pizza-pepperoni', 15],
        ['پیتزا سبزیجات', 'قارچ، فلفل دلمه، زیتون، آناناس', 320000, 'pizza-veggie'],
        ['پیتزا مخلوط ویژه', 'ژامبون، قارچ، فلفل، زیتون؛ تابه‌ای', 450000, 'pizza-mixed'],
      ],
      'پیش‌غذا': [
        ['نان سیر', 'نان تنوری با کره‌ی سیر و پنیر', 120000, 'garlic-bread'],
        ['سیب‌زمینی سرخ‌کرده', 'با سس مخصوص', 95000, 'fries'],
      ],
      'نوشیدنی': [
        ['لیموناد نعناع', 'لیموی تازه، نعناع و سودا', 110000, 'mint-lemonade'],
        ['نوشابه', 'قوطی ۳۳۰ میلی‌لیتری', 30000],
      ],
    },
  },
  {
    slug: 'dudi-burger',
    name: 'برگر دودی',
    description: 'برگر گوشت ۱۰۰٪ گوساله، گریل‌شده روی زغال.',
    cover: 'burger-cover',
    address: 'تهران، خیابان ولیعصر، پارک ساعی',
    cuisines: ['fastfood'],
    deliveryFee: 20000,
    minOrder: 150000,
    time: [25, 40],
    menu: {
      'برگرها': [
        ['برگر کلاسیک', '۱۸۰ گرم گوشت، کاهو، گوجه، پیاز، سس مخصوص', 330000, 'burger-classic'],
        ['چیزبرگر دوبل', 'دو لایه گوشت، دو لایه چدار', 420000, 'cheeseburger', 10],
        ['برگر مرغ سوخاری', 'فیله‌ی مرغ سوخاری، کاهو، سس رنچ', 310000, 'chicken-sandwich'],
      ],
      'کنار غذا': [['سیب‌زمینی سرخ‌کرده', 'خلال‌های تازه با ادویه‌ی مخصوص', 90000, 'fries']],
      'نوشیدنی': [['شیک شکلات', 'بستنی وانیلی، شکلات و شیر', 180000, 'chocolate-shake']],
    },
  },
  {
    slug: 'daneh-cafe',
    name: 'کافه دانه',
    description: 'قهوه‌ی تخصصی و دسرهای روز، برشته‌کاری هفتگی.',
    cover: 'latte',
    address: 'تهران، خیابان انقلاب، کالج',
    cuisines: ['cafe', 'dessert'],
    deliveryFee: 20000,
    minOrder: 100000,
    time: [20, 35],
    menu: {
      'قهوه': [
        ['اسپرسو', 'یک شات ۱۰۰٪ عربیکا', 95000, 'espresso'],
        ['کاپوچینو', 'اسپرسو، شیر بخارداده و فوم', 145000, 'cappuccino'],
        ['لاته', 'اسپرسو با شیر فراوان', 150000, 'latte', 10],
        ['موکا', 'اسپرسو، شکلات تلخ و شیر', 165000, 'mocha'],
        ['قهوه‌ی ترک', 'دم‌شده در جزوه', 105000, 'turkish-coffee'],
      ],
      'نوشیدنی سرد': [['آیس لاته', 'اسپرسو، شیر سرد و یخ', 160000, 'iced-latte']],
      'دسر': [
        ['چیزکیک نیویورکی', 'با سس توت‌فرنگی', 185000, 'cheesecake'],
        ['تیرامیسو', 'ماسکارپونه و اسپرسو', 195000, 'tiramisu', 0, false],
      ],
    },
  },
  {
    slug: 'sabzineh',
    name: 'سالاد بار سبزینه',
    description: 'سالاد، پاستا و اسموتی؛ سبک و تازه.',
    cover: 'caprese-salad',
    address: 'تهران، ونک، خیابان ملاصدرا',
    cuisines: ['salad'],
    deliveryFee: 25000,
    minOrder: 180000,
    time: [25, 40],
    menu: {
      'سالادها': [
        ['سالاد سزار', 'کاهو رسمی، مرغ گریل، کروتان، سس سزار', 310000, 'caesar-salad'],
        ['سالاد یونانی', 'گوجه، خیار، زیتون، پنیر فتا', 280000, 'greek-salad', 20],
        ['سالاد کاپرزه', 'گوجه‌گیلاسی، موتزارلای تازه، ریحان', 260000, 'caprese-salad'],
      ],
      'پاستا': [['پاستا آلفردو', 'پنه، مرغ گریل، سس قارچ و خامه', 345000, 'pasta-alfredo']],
      'اسموتی': [
        ['اسموتی توت‌فرنگی', 'توت‌فرنگی، موز و ماست', 150000, 'smoothie-strawberry'],
        ['اسموتی بری', 'تمشک، بلوبری و شیر بادام', 165000, 'smoothie-berry'],
      ],
    },
  },
  {
    slug: 'sahar-breakfast',
    name: 'صبحانه‌ی سحر',
    description: 'صبحانه‌ی ایرانی و فرنگی؛ هر روز از ۷ تا ۱۲.',
    cover: 'omelette',
    address: 'تهران، یوسف‌آباد، خیابان ابن‌سینا',
    cuisines: ['breakfast', 'iranian'],
    deliveryFee: 15000,
    minOrder: 120000,
    time: [20, 30],
    isOpen: false,
    menu: {
      'صبحانه': [
        ['املت ایرانی', 'گوجه‌ی تازه و تخم‌مرغ، با نان سنگک', 180000, 'omelette'],
        ['نیمرو با نان تست', 'دو تخم‌مرغ، کره و نان تست', 150000, 'fried-eggs-toast'],
        ['پنکیک موز و عسل', 'سه پنکیک پفکی با موز تازه و عسل', 210000, 'pancakes', 10],
      ],
      'نوشیدنی گرم': [
        ['چای ایرانی (قوری)', 'برای دو نفر', 70000, 'persian-tea'],
        ['دمنوش به‌لیمو', 'بدون کافئین', 90000, 'herbal-tea'],
      ],
    },
  },
  {
    slug: 'golpar-sweets',
    name: 'شیرینی‌سرای گلپر',
    description: 'شیرینی تازه‌ی روز، باقلوا و کیک‌های خانگی.',
    cover: 'baklava',
    address: 'تهران، تجریش، خیابان دربند',
    cuisines: ['dessert'],
    deliveryFee: 25000,
    minOrder: 150000,
    time: [30, 45],
    menu: {
      'شیرینی و کیک': [
        ['باقلوا پسته‌ای (نیم‌کیلو)', 'خمیر یوفکا، پسته‌ی کرمان، شربت گلاب', 280000, 'baklava'],
        ['نان خامه‌ای (۶ عدد)', 'خامه‌ی تازه‌ی روز', 190000, 'cream-puff', 15],
        ['کیک شکلاتی خیس', 'برش بزرگ با سس شکلات', 175000, 'chocolate-cake'],
        ['چیزکیک نیویورکی', 'با سس توت‌فرنگی خانگی', 185000, 'cheesecake'],
      ],
    },
  },
  {
    slug: 'bandar-seafood',
    name: 'دریایی بندر',
    description: 'غذاهای دریایی به سبک جنوب؛ میگو و ماهی تازه‌ی خلیج فارس.',
    cover: 'seafood-cover',
    address: 'تهران، شهرک غرب، بلوار فرحزادی',
    cuisines: ['seafood', 'iranian'],
    deliveryFee: 35000,
    minOrder: 300000,
    time: [40, 60],
    menu: {
      'غذاهای دریایی': [
        ['میگو پلو', 'برنج دم‌پختی با میگو و ادویه‌ی جنوبی', 520000, 'shrimp-pilaf'],
        ['میگو سوخاری', 'میگوی درشت سوخاری با سس تارتار', 460000, 'shrimp-fried', 15],
        ['میگو کبابی', 'دو سیخ میگوی زعفرانی', 540000, 'shrimp-grilled'],
        ['ماهی قزل‌آلا کبابی', 'با سبزیجات بخارپز و سیب‌زمینی', 410000, 'grilled-fish'],
        ['فیش اند چیپس', 'فیله‌ی ماهی سوخاری و سیب‌زمینی', 390000, 'fish-and-chips'],
      ],
    },
  },
];

const firstNames = ['علی', 'مریم', 'رضا', 'زهرا', 'محمد', 'فاطمه', 'حسین', 'نرگس', 'امیر', 'الهام', 'مهدی', 'نیلوفر', 'سینا', 'پریسا', 'کاوه', 'شیرین', 'آرش', 'ترانه', 'بهراد', 'یاسمن'];
const lastNames = ['احمدی', 'رضایی', 'کریمی', 'حسینی', 'موسوی', 'جعفری', 'صادقی', 'رحیمی', 'نوری', 'اکبری'];
const comments = [
  'خیلی خوشمزه بود و داغ رسید.',
  'کیفیت عالی، فقط کمی دیر رسید.',
  'بسته‌بندی تمیز و حجم مناسب.',
  'مثل همیشه عالی 👌',
  'قیمتش نسبت به کیفیت منصفانه است.',
  'پیک خیلی مؤدب بود، ممنون.',
  null,
];

// ------------------------------------------------------------------- seed

async function main() {
  mkdirSync(UPLOADS, { recursive: true });

  // Wipe in dependency order.
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.orderStatusLog.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.discountCode.deleteMany(),
    prisma.menuItem.deleteMany(),
    prisma.menuSection.deleteMany(),
    prisma.restaurant.deleteMany(),
    prisma.cuisine.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const cuisineIds = new Map<string, number>();
  for (const [i, c] of cuisines.entries()) {
    const created = await prisma.cuisine.create({ data: { ...c, sortOrder: i } });
    cuisineIds.set(c.slug, created.id);
  }

  const menuItems: { id: number; restaurantId: number; name: string; price: number; discountPercent: number }[] = [];
  const restaurantRows: { id: number; deliveryFee: number; isOpen: boolean }[] = [];
  for (const r of restaurants) {
    const restaurant = await prisma.restaurant.create({
      data: {
        slug: r.slug,
        name: r.name,
        description: r.description,
        cover: photo(r.cover),
        address: r.address,
        deliveryFee: r.deliveryFee,
        minOrder: r.minOrder,
        deliveryTimeMin: r.time[0],
        deliveryTimeMax: r.time[1],
        isOpen: r.isOpen ?? true,
        cuisines: { connect: r.cuisines.map((slug) => ({ id: cuisineIds.get(slug)! })) },
      },
    });
    restaurantRows.push({ id: restaurant.id, deliveryFee: r.deliveryFee, isOpen: r.isOpen ?? true });

    for (const [s, [sectionName, dishes]] of Object.entries(r.menu).entries()) {
      const section = await prisma.menuSection.create({ data: { restaurantId: restaurant.id, name: sectionName, sortOrder: s } });
      for (const [d, [name, description, price, image, discountPercent = 0, isAvailable = true]] of dishes.entries()) {
        const item = await prisma.menuItem.create({
          data: { restaurantId: restaurant.id, sectionId: section.id, name, description, price, discountPercent, isAvailable, image: photo(image), sortOrder: d },
        });
        if (isAvailable) menuItems.push(item);
      }
    }
  }

  // Users: one admin, one demo customer with addresses, and regular customers.
  await prisma.user.create({ data: { phone: '09120000000', name: 'مدیر سامانه', role: 'ADMIN' } });
  const demo = await prisma.user.create({
    data: {
      phone: '09121111111',
      name: 'سارا محمدی',
      addresses: {
        create: [
          { title: 'خانه', details: 'تهران، سعادت‌آباد، خیابان سرو غربی، پلاک ۱۲، واحد ۴', lat: 35.7801, lng: 51.3762 },
          { title: 'محل کار', details: 'تهران، ونک، خیابان ملاصدرا، برج نگار، طبقه‌ی ۶', lat: 35.7579, lng: 51.4096 },
        ],
      },
    },
  });
  const customers = [demo];
  for (let i = 0; i < 24; i++) {
    customers.push(
      await prisma.user.create({
        data: {
          phone: `0912${String(2000000 + i * 37421).padStart(7, '0')}`,
          name: `${pick(firstNames)} ${pick(lastNames)}`,
          createdAt: new Date(Date.now() - between(1, 60) * 86_400_000),
        },
      }),
    );
  }

  const welcome = await prisma.discountCode.create({
    data: { code: 'WELCOME', description: '۲۰٪ تخفیف تا سقف ۶۰ هزار تومان', type: 'PERCENT', value: 20, maxDiscount: 60000 },
  });
  await prisma.discountCode.createMany({
    data: [
      { code: 'SOFREH50', description: '۵۰ هزار تومان تخفیف برای سفارش‌های بالای ۴۰۰ هزار تومان', type: 'FIXED', value: 50000, minOrder: 400000, usageLimit: 500 },
      { code: 'YALDA', description: 'کد مناسبتی منقضی‌شده', type: 'PERCENT', value: 30, maxDiscount: 100000, expiresAt: new Date('2025-12-22T00:00:00+03:30') },
    ],
  });

  // A week of orders: older ones are delivered (or cancelled), today's are in progress.
  const flow: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING', 'DELIVERED'];
  const openRestaurants = restaurantRows.filter((r) => r.isOpen);
  let welcomeUses = 0;
  for (let i = 0; i < 84; i++) {
    const daysAgo = i < 10 ? 0 : between(0, 6);
    const createdAt = new Date(Date.now() - daysAgo * 86_400_000 - between(5, 600) * 60_000);
    const restaurant = i < 10 ? pick(openRestaurants) : pick(restaurantRows);
    const options = menuItems.filter((m) => m.restaurantId === restaurant.id);
    const lines = new Map<number, { item: (typeof options)[number]; quantity: number }>();
    for (let n = between(1, 3); n > 0; n--) {
      const item = pick(options);
      lines.set(item.id, { item, quantity: (lines.get(item.id)?.quantity ?? 0) + between(1, 2) });
    }
    const priced = [...lines.values()].map(({ item, quantity }) => ({
      item,
      quantity,
      unitPrice: Math.round((item.price * (100 - item.discountPercent)) / 100),
    }));
    const subtotal = priced.reduce((s, l) => s + l.item.price * l.quantity, 0);
    const food = priced.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const useCode = rand() < 0.2;
    const codeDiscount = useCode ? Math.min(Math.floor(food * 0.2), 60000) : 0;
    if (useCode) welcomeUses++;

    // Today's orders (i < 10) are spread over the live statuses; older ones mostly finished.
    const status: OrderStatus = i < 10 ? flow[i % 4] : rand() < 0.08 ? 'CANCELLED' : 'DELIVERED';
    const customer = i < 3 ? demo : pick(customers);
    const paymentMethod: PaymentMethod = rand() < 0.7 ? 'ONLINE' : 'CASH';
    const steps = status === 'CANCELLED' ? ['PENDING', 'CANCELLED'] : flow.slice(0, flow.indexOf(status) + 1);

    const order = await prisma.order.create({
      data: {
        code: `SF-${between(100000, 999999)}`,
        userId: customer.id,
        restaurantId: restaurant.id,
        status,
        paymentMethod,
        isPaid: paymentMethod === 'ONLINE' ? status !== 'CANCELLED' : status === 'DELIVERED',
        paymentRef: paymentMethod === 'ONLINE' && status !== 'CANCELLED' ? `DEMO-${between(10000000, 99999999)}` : null,
        subtotal,
        itemsDiscount: subtotal - food,
        codeDiscount,
        deliveryFee: restaurant.deliveryFee,
        total: food - codeDiscount + restaurant.deliveryFee,
        discountCodeId: useCode ? welcome.id : null,
        addressText: customer.id === demo.id ? 'خانه — تهران، سعادت‌آباد، خیابان سرو غربی، پلاک ۱۲، واحد ۴' : 'تهران، خیابان آزادی، کوچه‌ی نمونه، پلاک ۸',
        createdAt,
        updatedAt: createdAt,
        items: { create: priced.map((l) => ({ menuItemId: l.item.id, name: l.item.name, unitPrice: l.unitPrice, quantity: l.quantity })) },
        statusLogs: {
          create: steps.map((s, n) => ({ status: s as OrderStatus, createdAt: new Date(createdAt.getTime() + n * 7 * 60_000) })),
        },
      },
    });

    if (status === 'DELIVERED' && rand() < 0.65) {
      await prisma.review.create({
        data: {
          orderId: order.id,
          userId: customer.id,
          restaurantId: restaurant.id,
          rating: pick([5, 5, 5, 4, 4, 4, 3]),
          comment: pick(comments),
          createdAt: new Date(createdAt.getTime() + 90 * 60_000),
        },
      });
    }
  }
  await prisma.discountCode.update({ where: { id: welcome.id }, data: { usedCount: welcomeUses } });

  // Restaurant ratings from their reviews.
  for (const r of restaurantRows) {
    const stats = await prisma.review.aggregate({ where: { restaurantId: r.id }, _avg: { rating: true }, _count: true });
    await prisma.restaurant.update({
      where: { id: r.id },
      data: { rating: Math.round((stats._avg.rating ?? 0) * 10) / 10, ratingCount: stats._count },
    });
  }

  const counts = await Promise.all([prisma.restaurant.count(), prisma.menuItem.count(), prisma.order.count(), prisma.review.count()]);
  console.log(`Seeded ${counts[0]} restaurants, ${counts[1]} dishes, ${counts[2]} orders, ${counts[3]} reviews.`);
  console.log('Admin: 09120000000 · Demo customer: 09121111111 (log in with the OTP shown in dev mode)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
