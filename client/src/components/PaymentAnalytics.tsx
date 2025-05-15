import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Separator } from "./ui/separator";

interface PaymentAnalyticsProps {
  data: {
    totalRevenue: number;
    totalSessions: number;
    completedSessions: number;
    pendingSessions: number;
    cancelledSessions: number;
    confirmedSessions: number;
    averageSessionValue: number;
    studentRevenue: number;
    professionalRevenue: number;
    monthlyRevenue: Record<string, number>;
    userTypeDistribution: {
      students: number;
      professionals: number;
    };
    sessionDurationDistribution: {
      thirtyMin: number;
      sixtyMin: number;
    };
  };
}

const PaymentAnalytics: React.FC<PaymentAnalyticsProps> = ({ data }) => {
  // Format currency in INR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
  };

  // Current month and year
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4">
      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-gray-400 mt-1">Across all sessions</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSessions}</div>
            <p className="text-xs text-gray-400 mt-1">
              {data.completedSessions} completed ({formatPercentage(data.completedSessions, data.totalSessions)})
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Current Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.monthlyRevenue[`${currentMonth.toLowerCase()}_${currentYear}`] || 0)}
            </div>
            <p className="text-xs text-gray-400 mt-1">{currentMonth} {currentYear}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg. Session Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.averageSessionValue)}</div>
            <p className="text-xs text-gray-400 mt-1">Per session</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-base">Revenue Breakdown</CardTitle>
            <CardDescription>Revenue by user type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Students</span>
                <div className="flex items-center">
                  <span className="font-medium">{formatCurrency(data.studentRevenue)}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    ({formatPercentage(data.studentRevenue, data.totalRevenue)})
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(data.studentRevenue / data.totalRevenue) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Professionals</span>
                <div className="flex items-center">
                  <span className="font-medium">{formatCurrency(data.professionalRevenue)}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    ({formatPercentage(data.professionalRevenue, data.totalRevenue)})
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${(data.professionalRevenue / data.totalRevenue) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-base">Session Statistics</CardTitle>
            <CardDescription>Breakdown by status and type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Session Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-400">Completed</p>
                    <p className="text-lg font-medium">{data.completedSessions}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-400">Confirmed</p>
                    <p className="text-lg font-medium">{data.confirmedSessions}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-400">Pending</p>
                    <p className="text-lg font-medium">{data.pendingSessions}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-400">Cancelled</p>
                    <p className="text-lg font-medium">{data.cancelledSessions}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div>
                <h4 className="text-sm font-medium mb-2">User Type</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-400">Students</p>
                    <p className="text-lg font-medium">{data.userTypeDistribution.students}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-400">Professionals</p>
                    <p className="text-lg font-medium">{data.userTypeDistribution.professionals}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div>
                <h4 className="text-sm font-medium mb-2">Duration</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-400">30 Minutes</p>
                    <p className="text-lg font-medium">{data.sessionDurationDistribution.thirtyMin}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-400">60 Minutes</p>
                    <p className="text-lg font-medium">{data.sessionDurationDistribution.sixtyMin}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart (Simple text-based implementation) */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base">Monthly Revenue</CardTitle>
          <CardDescription>Revenue trends throughout the year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(data.monthlyRevenue).map(([monthKey, revenue]) => {
              const [month, year] = monthKey.split('_');
              return (
                <div 
                  key={monthKey} 
                  className="bg-gray-800 p-3 rounded-lg text-center"
                >
                  <p className="text-xs text-gray-400 capitalize">{month} {year}</p>
                  <p className="text-lg font-medium">{formatCurrency(revenue)}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentAnalytics;