import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareText } from 'lucide-react';

// Validation schema for WhatsApp invite link
const whatsappInviteSchema = z.object({
  inviteLink: z
    .string()
    .min(1, { message: 'WhatsApp invite link is required' })
    .regex(/^https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]{22}$/, {
      message: 'Please enter a valid WhatsApp group invite link (https://chat.whatsapp.com/XXXX)',
    }),
});

type WhatsAppInviteFormValues = z.infer<typeof whatsappInviteSchema>;

export default function AddWhatsAppBot() {
  const { toast } = useToast();
  
  const form = useForm<WhatsAppInviteFormValues>({
    resolver: zodResolver(whatsappInviteSchema),
    defaultValues: {
      inviteLink: '',
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (data: WhatsAppInviteFormValues) => {
      return apiRequest('POST', '/api/whatsapp/join-group', data);
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'The BambooMade bot will join your WhatsApp group shortly.',
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process your request. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: WhatsAppInviteFormValues) => {
    joinGroupMutation.mutate(values);
  };

  return (
    <div className="container max-w-screen-md mx-auto py-12">
      <Card className="border-green-100 dark:border-green-900">
        <CardHeader className="bg-green-50 dark:bg-green-900/30 border-b border-green-100 dark:border-green-900">
          <div className="flex items-center">
            <MessageSquareText className="h-6 w-6 mr-2 text-green-600 dark:text-green-400" />
            <CardTitle className="text-green-800 dark:text-green-300">Add BambooMade Bot to WhatsApp Group</CardTitle>
          </div>
          <CardDescription className="text-green-600 dark:text-green-400">
            Submit your WhatsApp group invite link and our bot will join your group automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="p-4 mb-6 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-100 dark:border-green-800">
            <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">How to get a WhatsApp group invite link:</h3>
            <ol className="list-decimal pl-5 text-green-700 dark:text-green-400 space-y-2">
              <li>Open your WhatsApp group</li>
              <li>Tap the group name at the top</li>
              <li>Scroll down and tap "Invite to group via link"</li>
              <li>Copy the link and paste it below</li>
            </ol>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="inviteLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700 dark:text-green-400">WhatsApp Group Invite Link</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://chat.whatsapp.com/XXXXXXXXXXXX" 
                        {...field} 
                        className="border-green-200 dark:border-green-800 focus:ring-green-500"
                      />
                    </FormControl>
                    <FormDescription>
                      Paste the WhatsApp group invite link here
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={joinGroupMutation.isPending}
              >
                {joinGroupMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    Add Bot to Group
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-green-100 dark:border-green-900 pt-4 text-sm text-green-600 dark:text-green-400">
          The BambooMade bot will automatically respond to relevant questions about bamboo in your group.
        </CardFooter>
      </Card>
    </div>
  );
}