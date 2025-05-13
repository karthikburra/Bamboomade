import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';

export function LoginHistoryDebugger() {
  const [userId, setUserId] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkLoginHistory = async () => {
    if (!userId || isNaN(parseInt(userId))) {
      toast({
        title: "Invalid User ID",
        description: "Please enter a valid numeric user ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('GET', `/api/users/${userId}/login-history`);
      const data = await response.json();
      setResults(data);
      console.log("Login history data:", data);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch login history: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle>Login History Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter User ID"
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
          />
          <Button onClick={checkLoginHistory} disabled={loading}>
            {loading ? 'Loading...' : 'Check Login History'}
          </Button>
        </div>

        {results && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Results:</h3>
            <div className="bg-gray-800 p-4 rounded overflow-auto max-h-96">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}