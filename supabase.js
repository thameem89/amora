'use strict';

const supabaseUrl = 'https://sxahfgeuphfkdymfgvlv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YWhmZ2V1cGhma2R5bWZndmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjA0OTIsImV4cCI6MjA5OTA5NjQ5Mn0.wu-7QuXpMxQgjFGf7ElXU86lgIW0Lo0PnYqUeRwMcGs';

// Initialize Supabase Client
const supabase = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

// Default products to seed on first run
const defaultProducts = [
  {
    id: "fleur-dor",
    name: "Fleur d'Or",
    sku: "AN-FL-01",
    category: "Floral",
    price: 299,
    stock: 45,
    description: "A timeless floral bouquet — roses in full bloom, carried on whispers of soft musk and warm sandalwood.",
    image: "assets/products/fleur-dor-01_amora_noir_fleur_dor_hero.webp",
    status: "Active",
    sales: 120,
    topNotes: "Bergamot, Lemon, Pear",
    heartNotes: "Jasmine, Rose, Ylang-Ylang",
    baseNotes: "Musk, Sandalwood, Patchouli",
    gallery: ["assets/products/fleur-dor-01_amora_noir_fleur_dor_hero.webp"]
  },
  {
    id: "royal-oud-noir",
    name: "Royal Oud Noir",
    sku: "AN-RO-02",
    category: "Oud",
    price: 399,
    stock: 12,
    description: "Indulge in the art of fine fragrance with Amora Noir. Where Arabian heritage meets modern elegance.",
    image: "assets/products/royal-oud-01_product_hero_front.webp",
    status: "Active",
    sales: 85,
    topNotes: "Saffron, Nutmeg, Lavender",
    heartNotes: "Oud Wood, Patchouli",
    baseNotes: "Musk, Sandalwood, Amber",
    gallery: ["assets/products/royal-oud-01_product_hero_front.webp"]
  },
  {
    id: "golden-elixir",
    name: "Golden Elixir",
    sku: "AN-GE-03",
    category: "Amber",
    price: 499,
    stock: 24,
    description: "Liquid gold in a bottle. A warm, opulent accord of amber, oud, and precious spices — unforgettable.",
    image: "assets/products/golden-elixir-01_product_hero_front.webp",
    status: "Active",
    sales: 98,
    topNotes: "Cinnamon, Cardamom, Bergamot",
    heartNotes: "Amber, Honey, Rose",
    baseNotes: "Oud, Vanilla, Labdanum",
    gallery: ["assets/products/golden-elixir-01_product_hero_front.webp"]
  }
];

window.db = {
  // Fetch all products
  async getProducts() {
    if (!supabase) {
      console.warn('Supabase client not loaded, falling back to LocalStorage.');
      return JSON.parse(localStorage.getItem('amora_products')) || [];
    }
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.error('Error fetching products from Supabase:', error);
      return JSON.parse(localStorage.getItem('amora_products')) || [];
    }
    return data;
  },

  // Fetch a single product by ID
  async getProduct(id) {
    if (!supabase) {
      const products = JSON.parse(localStorage.getItem('amora_products')) || [];
      return products.find(p => p.id === id);
    }
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error(`Error fetching product ${id} from Supabase:`, error);
      const products = JSON.parse(localStorage.getItem('amora_products')) || [];
      return products.find(p => p.id === id);
    }
    return data;
  },

  // Insert or Update a product
  async upsertProduct(product) {
    // Keep local storage in sync as fallback
    let localProducts = JSON.parse(localStorage.getItem('amora_products')) || [];
    const idx = localProducts.findIndex(p => p.id === product.id);
    if (idx !== -1) {
      localProducts[idx] = product;
    } else {
      localProducts.push(product);
    }
    localStorage.setItem('amora_products', JSON.stringify(localProducts));

    if (!supabase) return true;

    const { error } = await supabase.from('products').upsert(product);
    if (error) {
      console.error('Error saving product to Supabase:', error);
      return false;
    }
    return true;
  },

  // Delete a product
  async deleteProduct(id) {
    // Keep local storage in sync
    let localProducts = JSON.parse(localStorage.getItem('amora_products')) || [];
    localProducts = localProducts.filter(p => p.id !== id);
    localStorage.setItem('amora_products', JSON.stringify(localProducts));

    if (!supabase) return true;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Error deleting product from Supabase:', error);
      return false;
    }
    return true;
  },

  // Fetch all orders
  async getOrders() {
    if (!supabase) {
      console.warn('Supabase client not loaded, falling back to LocalStorage.');
      return JSON.parse(localStorage.getItem('amora_orders')) || [];
    }
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching orders from Supabase:', error);
      return JSON.parse(localStorage.getItem('amora_orders')) || [];
    }
    return data;
  },

  // Create a new customer order
  async createOrder(order) {
    // Keep local storage in sync
    let localOrders = JSON.parse(localStorage.getItem('amora_orders')) || [];
    localOrders.push(order);
    localStorage.setItem('amora_orders', JSON.stringify(localOrders));

    if (!supabase) return true;

    const { error } = await supabase.from('orders').insert(order);
    if (error) {
      console.error('Error saving order to Supabase:', error);
      return false;
    }
    return true;
  },

  // Update order status (Processing, Shipped, Delivered, Cancelled)
  async updateOrderStatus(orderId, status) {
    // Keep local storage in sync
    let localOrders = JSON.parse(localStorage.getItem('amora_orders')) || [];
    const o = localOrders.find(ord => ord.id === orderId);
    if (o) {
      o.status = status;
      localStorage.setItem('amora_orders', JSON.stringify(localOrders));
    }

    if (!supabase) return true;

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) {
      console.error(`Error updating order ${orderId} in Supabase:`, error);
      return false;
    }
    return true;
  },

  // Auto-seed Supabase database with default products if empty
  async seedProductsIfNeeded() {
    if (!supabase) return;
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      if (error) {
        console.error('Error checking database status:', error);
        return;
      }
      if (count === 0) {
        console.log('Database empty. Seeding default products to Supabase...');
        const { error: seedError } = await supabase.from('products').insert(defaultProducts);
        if (seedError) {
          console.error('Error seeding default products:', seedError);
        }
      }
    } catch (err) {
      console.error('Failed to run database seeder check:', err);
    }
  }
};
