// Catalog "Góc Công Nghệ ShopAI" — mỗi ảnh đã được soi tận mắt để khớp đúng món hàng.
// id prod_1..prod_10 giữ nguyên để giỏ hàng / Deep Link cũ (shopai://product/prod_3) không gãy.
export type ProductCategory =
  'gaming' | 'computer' | 'phone' | 'audio' | 'camera' | 'home';

export interface ProductEntity {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number; // VND, số nguyên
  rating: number; // 0–5, một chữ số thập phân
  stock: number;
  image: string;
  description: string;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  gaming: 'Gaming',
  computer: 'Máy tính',
  phone: 'Điện thoại & Tablet',
  audio: 'Âm thanh',
  camera: 'Máy ảnh',
  home: 'Nhà & Văn phòng',
};

const img = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=600&q=80`;

export const PRODUCTS: ProductEntity[] = [
  {
    id: 'prod_1',
    name: 'Bàn phím cơ ATK68 keycap phối màu',
    brand: 'ATK',
    category: 'gaming',
    price: 1890000,
    rating: 4.8,
    stock: 24,
    image: img('photo-1595225476474-87563907a212'),
    description:
      'Layout 65% gọn bàn, switch từ tính có Rapid Trigger, keycap PBT phối màu retro. Hợp cả gõ code lẫn chơi FPS.',
  },
  {
    id: 'prod_2',
    name: 'Chuột không dây siêu nhẹ 49g',
    brand: 'ATK',
    category: 'gaming',
    price: 1250000,
    rating: 4.7,
    stock: 31,
    image: img('photo-1615663245857-ac93bb7c39e7'),
    description:
      'Thân chuột đặc không lỗ chỉ 49g, cảm biến 30.000 DPI, kết nối 2.4GHz độ trễ thấp, pin dùng khoảng 100 giờ.',
  },
  {
    id: 'prod_3',
    name: 'Máy ảnh DSLR Canon EOS kèm lens 18-55mm',
    brand: 'Canon',
    category: 'camera',
    price: 9490000,
    rating: 4.6,
    stock: 6,
    image: img('photo-1502920917128-1aa500764cbd'),
    description:
      'Cảm biến APS-C 24MP, kính ngắm quang học, quay Full HD. Bộ kit nhập môn chụp ảnh sản phẩm và chân dung.',
  },
  {
    id: 'prod_4',
    name: 'Màn hình 27 inch 4K viền mỏng',
    brand: 'ShopAI Select',
    category: 'computer',
    price: 7650000,
    rating: 4.5,
    stock: 12,
    image: img('photo-1527443224154-c4a3942d3acf'),
    description:
      'Tấm nền IPS 4K phủ 99% sRGB, chân nhôm tối giản, cổng USB-C sạc ngược 65W — cắm laptop một dây là xong.',
  },
  {
    id: 'prod_5',
    name: 'Tai nghe chụp tai Bluetooth chống ồn',
    brand: 'SoundPeats',
    category: 'audio',
    price: 890000,
    rating: 4.4,
    stock: 40,
    image: img('photo-1505740420928-5e560c06d30e'),
    description:
      'Chống ồn chủ động ANC, đệm tai da mềm, pin 60 giờ, chế độ Game độ trễ 60ms. Giá học sinh sinh viên.',
  },
  {
    id: 'prod_6',
    name: 'Chuột gaming có dây LED RGB',
    brand: 'Redragon',
    category: 'gaming',
    price: 450000,
    rating: 4.3,
    stock: 55,
    image: img('photo-1629429408209-1f912961dbd8'),
    description:
      'Dải LED RGB tùy chỉnh, 7 nút lập trình được, cảm biến 12.400 DPI, dây bọc dù chống rối.',
  },
  {
    id: 'prod_7',
    name: 'Bàn phím không dây mỏng vỏ nhôm',
    brand: 'Apple',
    category: 'computer',
    price: 2490000,
    rating: 4.6,
    stock: 18,
    image: img('photo-1587829741301-dc798b83add3'),
    description:
      'Bàn phím cắt kéo mỏng nhẹ, vỏ nhôm, sạc USB-C dùng cả tháng. Gõ êm, hợp không gian làm việc tối giản.',
  },
  {
    id: 'prod_8',
    name: 'Tay cầm PlayStation DualShock 4 trắng',
    brand: 'Sony',
    category: 'gaming',
    price: 1150000,
    rating: 4.7,
    stock: 22,
    image: img('photo-1509198397868-475647b2a1e5'),
    description:
      'Touchpad, loa và đèn LED tích hợp, rung kép. Dùng cho PS4, PC (Steam) và cả điện thoại qua Bluetooth.',
  },
  {
    id: 'prod_9',
    name: 'Tay cầm Xbox Wireless Controller',
    brand: 'Microsoft',
    category: 'gaming',
    price: 1390000,
    rating: 4.8,
    stock: 27,
    image: img('photo-1600080972464-8e5f35f63d08'),
    description:
      'Grip nhám chống trượt, nút Share, kết nối Xbox Wireless + Bluetooth. Chuẩn tay cầm cho game PC.',
  },
  {
    id: 'prod_10',
    name: 'Smart TV 55 inch 4K HDR',
    brand: 'ShopAI Select',
    category: 'home',
    price: 11990000,
    rating: 4.5,
    stock: 8,
    image: img('photo-1593359677879-a4bb92f829d1'),
    description:
      'Màn 4K HDR10, kho ứng dụng Netflix / YouTube / FPT Play, điều khiển giọng nói tiếng Việt, đèn nền viền.',
  },
  {
    id: 'prod_11',
    name: 'MacBook Air M3 13 inch 16GB/512GB',
    brand: 'Apple',
    category: 'computer',
    price: 32990000,
    rating: 4.9,
    stock: 10,
    image: img('photo-1517336714731-489689fd1ca8'),
    description:
      'Chip M3, RAM 16GB, SSD 512GB, pin tới 18 giờ, nặng 1.24kg. Máy "quốc dân" cho sinh viên IT.',
  },
  {
    id: 'prod_12',
    name: 'iPhone 15 Pro 128GB',
    brand: 'Apple',
    category: 'phone',
    price: 24990000,
    rating: 4.8,
    stock: 14,
    image: img('photo-1592750475338-74b7b21085ab'),
    description:
      'Khung titan, chip A17 Pro, cụm 3 camera 48MP zoom quang 3x, cổng USB-C tốc độ USB 3.',
  },
  {
    id: 'prod_13',
    name: 'Tai nghe AirPods thế hệ 3',
    brand: 'Apple',
    category: 'audio',
    price: 3990000,
    rating: 4.6,
    stock: 35,
    image: img('photo-1600294037681-c80b4cb5b434'),
    description:
      'Âm thanh không gian, chống nước IPX4, hộp sạc MagSafe. Kết nối tức thì với iPhone/iPad.',
  },
  {
    id: 'prod_14',
    name: 'Đồng hồ thông minh mặt tròn dây silicon',
    brand: 'Samsung',
    category: 'phone',
    price: 5490000,
    rating: 4.4,
    stock: 20,
    image: img('photo-1523275335684-37898b6baf30'),
    description:
      'Màn AMOLED 1.3 inch, đo nhịp tim, SpO2, theo dõi giấc ngủ, chống nước 5ATM, pin 40 giờ.',
  },
  {
    id: 'prod_15',
    name: 'Loa Bluetooth JBL Flip chống nước',
    brand: 'JBL',
    category: 'audio',
    price: 2690000,
    rating: 4.7,
    stock: 25,
    image: img('photo-1608043152269-423dbba4e7e1'),
    description:
      'Công suất 30W, chống nước bụi IP67, pin 12 giờ, ghép đôi nhiều loa PartyBoost. Mang đi dã ngoại cực hợp.',
  },
  {
    id: 'prod_16',
    name: 'iPad Air M2 11 inch kèm bút',
    brand: 'Apple',
    category: 'phone',
    price: 18990000,
    rating: 4.8,
    stock: 9,
    image: img('photo-1544244015-0df4b3ffc6b0'),
    description:
      'Chip M2, màn Liquid Retina 11 inch, hỗ trợ bút cảm ứng ghi chú bài giảng, Touch ID cạnh viền.',
  },
  {
    id: 'prod_17',
    name: 'Điện thoại Xiaomi Redmi Note 13',
    brand: 'Xiaomi',
    category: 'phone',
    price: 4890000,
    rating: 4.3,
    stock: 45,
    image: img('photo-1609091839311-d5365f9ff1c5'),
    description:
      'Màn AMOLED 120Hz, camera 108MP, sạc nhanh 33W, pin 5000mAh. Ngon trong tầm giá dưới 5 triệu.',
  },
  {
    id: 'prod_18',
    name: 'Tai nghe Sony WH-1000XM5',
    brand: 'Sony',
    category: 'audio',
    price: 7990000,
    rating: 4.9,
    stock: 11,
    image: img('photo-1546435770-a3e426bf472b'),
    description:
      'Chống ồn hàng đầu phân khúc với 8 micro, pin 30 giờ, sạc 3 phút nghe 3 giờ, gập gọn đi máy bay.',
  },
  {
    id: 'prod_19',
    name: 'Tản nhiệt nước AIO 360mm ARGB',
    brand: 'Corsair',
    category: 'computer',
    price: 3290000,
    rating: 4.6,
    stock: 7,
    image: img('photo-1597872200969-2b65d56bd16b'),
    description:
      'Radiator 360mm, 3 quạt ARGB đồng bộ hiệu ứng, màn LCD trên block bơm. Giữ CPU mát lạnh khi render.',
  },
  {
    id: 'prod_20',
    name: 'Router Wi-Fi 6 băng tần kép',
    brand: 'TP-Link',
    category: 'home',
    price: 1590000,
    rating: 4.5,
    stock: 30,
    image: img('photo-1606904825846-647eb07f5be2'),
    description:
      'Chuẩn Wi-Fi 6 AX3000, OFDMA + MU-MIMO, phủ sóng ổn định cho nhà 3–4 phòng, cài đặt qua app.',
  },
  {
    id: 'prod_21',
    name: 'Máy ảnh mirrorless Sony Alpha + 2 lens',
    brand: 'Sony',
    category: 'camera',
    price: 21990000,
    rating: 4.8,
    stock: 4,
    image: img('photo-1516035069371-29a1b244cc32'),
    description:
      'Cảm biến 24MP lấy nét mắt theo thời gian thực, quay 4K, combo lens kit + lens fix chân dung.',
  },
  {
    id: 'prod_22',
    name: 'Tai nghe True Wireless Gaming độ trễ thấp',
    brand: 'SoundPeats',
    category: 'audio',
    price: 690000,
    rating: 4.2,
    stock: 60,
    image: img('photo-1606220945770-b5b6c2c55bf1'),
    description:
      'Chế độ Game 60ms, Bluetooth 5.3, pin tổng 30 giờ, hộp sạc vỏ nhám chống bám vân tay.',
  },
  {
    id: 'prod_23',
    name: 'Bàn phím cơ 65% keycap trắng kem',
    brand: 'Akko',
    category: 'gaming',
    price: 1690000,
    rating: 4.6,
    stock: 19,
    image: img('photo-1625948515291-69613efd103f'),
    description:
      'Mạch hotswap, gasket mount, keycap PBT tông trắng kem. Âm gõ "thock" trầm, setup bàn trắng cực xinh.',
  },
  {
    id: 'prod_24',
    name: 'Chuột Logitech G304 Lightspeed trắng',
    brand: 'Logitech',
    category: 'gaming',
    price: 790000,
    rating: 4.7,
    stock: 70,
    image: img('photo-1527814050087-3793815479db'),
    description:
      'Kết nối Lightspeed 1ms, cảm biến HERO 12K DPI, 1 pin AA dùng 250 giờ. Chuột "quốc dân" giá mềm.',
  },
  {
    id: 'prod_25',
    name: 'Máy in laser màu đa năng HP',
    brand: 'HP',
    category: 'home',
    price: 8490000,
    rating: 4.3,
    stock: 5,
    image: img('photo-1612815154858-60aa4c59eaa6'),
    description:
      'In - scan - copy màu, in Wi-Fi từ điện thoại, khay 150 tờ. Đủ dùng cho văn phòng nhỏ và in tài liệu học.',
  },
];
