import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Package,
  ShoppingCart,
  FileText,
  RefreshCw,
  Github
} from 'lucide-react';
import { useApp } from '../AppContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  trend?: number; 
  icon: React.ElementType; 
  color: string;
  onClick?: () => void;
}> = ({ title, value, trend, icon: Icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4 hover:shadow-md transition-all text-right w-full"
  >
    <div className="flex items-center justify-between w-full">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-medium ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </div>
  </button>
);

const Dashboard: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const { products, invoices, settings, customers, expenses } = useApp();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateStatus, setUpdateStatus] = React.useState<'idle' | 'checking' | 'updating' | 'success'>('idle');

  const handleSystemUpdate = () => {
    setUpdateStatus('checking');
    
    // Simulate checking for updates
    setTimeout(() => {
      setUpdateStatus('updating');
      
      // Simulate downloading and applying updates
      setTimeout(() => {
        setUpdateStatus('success');
        
        // Finalize update and refresh
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }, 3000);
    }, 2000);
  };

  const totalSales = invoices.filter(i => i.type === 'sale').reduce((acc, curr) => acc + curr.total, 0) - invoices.filter(i => i.type === 'sale_return').reduce((acc, curr) => acc + curr.total, 0);
  const totalPurchases = invoices.filter(i => i.type === 'purchase').reduce((acc, curr) => acc + curr.total, 0) - invoices.filter(i => i.type === 'purchase_return').reduce((acc, curr) => acc + curr.total, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalSales - totalPurchases - totalExpenses;
  const pendingDues = customers.reduce((acc, curr) => acc + Math.abs(curr.balance || 0), 0);

  // Trend Calculations
  const calculatePeriodStats = (startDate: Date, endDate: Date) => {
    const periodInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.date);
      return invDate >= startDate && invDate <= endDate;
    });

    const periodExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= startDate && expDate <= endDate;
    });

    const sales = periodInvoices.filter(i => i.type === 'sale').reduce((acc, curr) => acc + curr.total, 0) - 
                  periodInvoices.filter(i => i.type === 'sale_return').reduce((acc, curr) => acc + curr.total, 0);
    
    const purchases = periodInvoices.filter(i => i.type === 'purchase').reduce((acc, curr) => acc + curr.total, 0) - 
                      periodInvoices.filter(i => i.type === 'purchase_return').reduce((acc, curr) => acc + curr.total, 0);
    
    const exp = periodExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    
    return { sales, purchases, expenses: exp, netProfit: sales - purchases - exp };
  };

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const currentMonthStats = calculatePeriodStats(startOfCurrentMonth, now);
  const previousMonthStats = calculatePeriodStats(startOfPreviousMonth, endOfPreviousMonth);

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const salesTrend = calculateTrend(currentMonthStats.sales, previousMonthStats.sales);
  const purchasesTrend = calculateTrend(currentMonthStats.purchases, previousMonthStats.purchases);
  const profitTrend = calculateTrend(currentMonthStats.netProfit, previousMonthStats.netProfit);

  // Chart Data Population
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (now.getMonth() - 5 + i + 12) % 12;
    const year = now.getFullYear() - (now.getMonth() - 5 + i < 0 ? 1 : 0);
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0);
    const stats = calculatePeriodStats(startDate, endDate);
    return {
      name: months[monthIndex],
      sales: stats.sales,
      purchases: stats.purchases
    };
  });

  // Pie Data Population (Top 5 Selling Items)
  const productSales: Record<string, { name: string; value: number }> = {};
  invoices.filter(i => i.type === 'sale').forEach(inv => {
    inv.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.name, value: 0 };
      }
      productSales[item.productId].value += item.quantity;
    });
  });

  const pieData = Object.values(productSales)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const COLORS = ['#2d6a61', '#14b8a6', '#5eead4', '#99f6e4'];

  const lowStockProducts = products.filter(p => p.quantity <= p.minStock);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-gray-500 dark:text-gray-400">مرحباً بك في نظام إدارة العطارة</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-lg font-medium">
          <TrendingUp size={20} />
          <span>أداء متميز هذا الشهر</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="إجمالي المبيعات" 
          value={`${totalSales.toLocaleString()} ${settings.currency}`} 
          trend={salesTrend} 
          icon={DollarSign} 
          color="bg-amber-600"
          onClick={() => onTabChange('sales')}
        />
        <StatCard 
          title="إجمالي المشتريات" 
          value={`${totalPurchases.toLocaleString()} ${settings.currency}`} 
          trend={purchasesTrend} 
          icon={ShoppingCart} 
          color="bg-blue-600"
          onClick={() => onTabChange('sales')}
        />
        <StatCard 
          title="صافي الأرباح" 
          value={`${netProfit.toLocaleString()} ${settings.currency}`} 
          trend={profitTrend} 
          icon={TrendingUp} 
          color="bg-indigo-900"
          onClick={() => onTabChange('pl_report')}
        />
        <StatCard 
          title="المبالغ المستحقة" 
          value={`${pendingDues.toLocaleString()} ${settings.currency}`} 
          icon={AlertCircle} 
          color="bg-purple-600"
          onClick={() => onTabChange('customers')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales vs Purchases Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6">مقارنة المبيعات بالمشتريات</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#14b8a6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} name="المبيعات" />
                <Area type="monotone" dataKey="purchases" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPurchases)" strokeWidth={3} name="المشتريات" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6">الأصناف الأكثر مبيعاً</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">تنبيهات المخزون</h3>
            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded text-xs font-bold">
              {lowStockProducts.length} تنبيه
            </span>
          </div>
          <div className="space-y-4">
            {lowStockProducts.length > 0 ? lowStockProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                <div className="flex items-center gap-3">
                  <Package className="text-red-500" size={20} />
                  <div>
                    <p className="font-bold text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">الكمية الحالية: {product.quantity} {product.unit}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onTabChange('inventory')}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  طلب كمية
                </button>
              </div>
            )) : (
              <p className="text-center text-gray-500 py-8">لا توجد تنبيهات حالياً</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6">الفواتير الآجلة المستحقة اليوم</h3>
          <div className="space-y-4">
            <p className="text-center text-gray-500 py-8">لا توجد فواتير مستحقة اليوم</p>
          </div>
        </div>
      </div>

      {/* System Update Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <RefreshCw size={24} className={updateStatus !== 'idle' && updateStatus !== 'success' ? 'animate-spin' : ''} />
            </div>
            <div>
              <h3 className="text-lg font-bold">تحديث النظام</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {updateStatus === 'idle' && 'تحقق من وجود تحديثات جديدة من GitHub'}
                {updateStatus === 'checking' && 'جاري التحقق من وجود تحديثات...'}
                {updateStatus === 'updating' && 'جاري تحميل وتثبيت التحديثات...'}
                {updateStatus === 'success' && 'تم التحديث بنجاح! جاري إعادة التشغيل...'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="text-right sm:text-left">
              <p className="text-xs text-gray-400">الإصدار الحالي: v1.2.5</p>
              <p className="text-xs text-gray-400">آخر تحديث: {new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            <button
              onClick={handleSystemUpdate}
              disabled={updateStatus !== 'idle'}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all w-full sm:w-auto ${
                updateStatus === 'idle' 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Github size={18} />
              <span>تحديث من GitHub</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
