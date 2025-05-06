import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Full interface for complete booking flow
interface BookingCalendarFullProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  selectedDuration: number;
  setSelectedDuration: (duration: number) => void;
  isStudent?: boolean; // Add isStudent property to determine pricing
}

// Simplified interface for rescheduling flow
interface BookingCalendarSimpleProps {
  selectedDate: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

// Unified interface type using discriminated union
type BookingCalendarProps = BookingCalendarFullProps | BookingCalendarSimpleProps;

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00"
];

// Define separate duration options for students and professionals (removed 90 minutes option)
const studentDurations = [
  { value: 30, label: "30 minutes - ₹500" },
  { value: 60, label: "60 minutes - ₹800" }
];

const professionalDurations = [
  { value: 30, label: "30 minutes - ₹1,000" },
  { value: 60, label: "60 minutes - ₹1,500" }
];

// Type guard to determine which interface we're using
function isFullProps(props: BookingCalendarProps): props is BookingCalendarFullProps {
  return 'setSelectedTime' in props && 'setSelectedDuration' in props;
}

// Define interfaces for available time slots with booking status
interface TimeSlotWithStatus {
  time: string;
  isBooked: boolean;
}

interface AvailableSlot {
  id: number;
  date: string;
  slots: string[];
  slotsWithStatus?: TimeSlotWithStatus[];
  allSlotsBooked?: boolean;
  createdAt: Date;
  createdBy: number;
  updatedAt: Date;
}

const BookingCalendar: React.FC<BookingCalendarProps> = (props) => {
  // Determine which props interface we're using
  const { selectedDate } = props;
  
  // Add state for popover open/close
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  
  // Fetch available time slots from API
  const { data: availableSlots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ["/api/available-slots"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/available-slots");
        return response.json();
      } catch (error) {
        console.error("Failed to fetch available slots:", error);
        return { slots: [] }; // Return empty slots on error
      }
    },
    // Keep the data fresh, but not too frequent
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get available time slot information for the selected date
  const getSlotInfoForDate = (date: Date | undefined): { 
    availableSlots: string[],
    slotsWithStatus?: TimeSlotWithStatus[],
    allSlotsBooked?: boolean
  } => {
    if (!date || !availableSlots || !availableSlots.slots) {
      return { availableSlots: timeSlots }; // Return default slots if no data
    }
    
    // Format the date to match the API format (YYYY-MM-DD)
    const formattedDate = format(date, "yyyy-MM-dd");
    
    // Find the matching slot for this date
    const matchingSlot = availableSlots.slots.find(
      (slot: AvailableSlot) => slot.date === formattedDate
    );
    
    if (!matchingSlot) {
      return { availableSlots: timeSlots };
    }
    
    // Get only non-booked time slots
    let availableSlotsFiltered: string[] = [];
    
    if (matchingSlot.slotsWithStatus) {
      availableSlotsFiltered = matchingSlot.slotsWithStatus
        .filter((slot: TimeSlotWithStatus) => !slot.isBooked)
        .map((slot: TimeSlotWithStatus) => slot.time);
    } else {
      availableSlotsFiltered = matchingSlot.slots;
    }
    
    // Return both the available slots and booking status information
    return {
      availableSlots: availableSlotsFiltered,
      slotsWithStatus: matchingSlot.slotsWithStatus,
      allSlotsBooked: matchingSlot.allSlotsBooked
    };
  };
  
  // Handle date selection based on which props we received
  const handleDateSelect = (date: Date | undefined) => {
    if (isFullProps(props)) {
      props.setSelectedDate(date);
      // Reset time selection when date changes
      props.setSelectedTime("");
      // Auto close the date popover when a date is selected
      setDatePopoverOpen(false);
    } else {
      props.onChange(date);
      setDatePopoverOpen(false);
    }
  };
  
  // Get slot information for the currently selected date
  const slotInfo = getSlotInfoForDate(selectedDate);
  const availableTimeSlots = slotInfo.availableSlots;
  const slotsWithStatus = slotInfo.slotsWithStatus || [];
  
  // Check if a specific time slot is booked
  const isTimeSlotBooked = (time: string): boolean => {
    if (!slotsWithStatus || slotsWithStatus.length === 0) return false;
    const slot = slotsWithStatus.find(s => s.time === time);
    return slot ? slot.isBooked : false;
  };
  
  // Function to check if a date should be disabled or has special styling
  const isDateDisabled = (date: Date) => {
    // Disable dates in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Format the date to match the API format (YYYY-MM-DD)
    const formattedDate = format(date, "yyyy-MM-dd");
    
    // Check if this date has any available slots
    if (availableSlots && availableSlots.slots) {
      const matchingSlot = availableSlots.slots.find(
        (slot: AvailableSlot) => slot.date === formattedDate
      );
      
      // If matchingSlot doesn't exist or has no time slots, disable the date
      if (!matchingSlot || matchingSlot.slots.length === 0) {
        return true;
      }
      
      // If all slots for this date are booked, disable it
      if (matchingSlot.allSlotsBooked) {
        return true;
      }
      
      // Check if there are any available (non-booked) time slots
      if (matchingSlot.slotsWithStatus) {
        const availableSlotCount = matchingSlot.slotsWithStatus.filter(
          (slot: TimeSlotWithStatus) => !slot.isBooked
        ).length;
        
        // If no available slots for this date, disable it
        if (availableSlotCount === 0) {
          return true;
        }
      }
    }
    
    // Default behavior - disable past dates
    return date < today;
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Date</h3>
        <Select
          value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
          onValueChange={(value) => {
            if (value) {
              handleDateSelect(new Date(value));
            } else {
              handleDateSelect(undefined);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select a date" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {(() => {
              // Generate next 30 days as options
              const dateOptions = [];
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(today.getDate() + i);
                date.setHours(0, 0, 0, 0);
                
                // Skip if date should be disabled
                if (isDateDisabled(date)) continue;
                
                // Format for display and value
                const formattedDate = format(date, "yyyy-MM-dd");
                const displayDate = format(date, "PPP");
                
                // Check if it's today
                const isToday = date.getTime() === today.getTime();
                
                dateOptions.push(
                  <SelectItem 
                    key={formattedDate} 
                    value={formattedDate}
                    className={cn(
                      "flex items-center",
                      isToday && "font-bold"
                    )}
                  >
                    <span className={isToday ? "text-green-600 dark:text-green-500" : ""}>
                      {displayDate}{isToday ? " (Today)" : ""}
                    </span>
                  </SelectItem>
                );
              }
              
              return dateOptions;
            })()}
          </SelectContent>
        </Select>
        
        {/* Optionally add a small calendar icon button to show the traditional calendar view */}
        <div className="text-center mt-1">
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <CalendarIcon className="h-3 w-3 mr-1" /> View Calendar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                disabled={isDateDisabled}
                modifiers={{
                  booked: (date) => {
                    // Check if all slots for this date are booked
                    if (!availableSlots || !availableSlots.slots) return false;
                    
                    const formattedDate = format(date, "yyyy-MM-dd");
                    const matchingSlot = availableSlots.slots.find(
                      (slot: AvailableSlot) => slot.date === formattedDate
                    );
                    
                    if (!matchingSlot) return false;
                    
                    // First check the explicit allSlotsBooked flag
                    if (matchingSlot.allSlotsBooked) return true;
                    
                    // Then check if all slots have isBooked=true
                    if (matchingSlot.slotsWithStatus) {
                      const availableSlotCount = matchingSlot.slotsWithStatus.filter(
                        (slot: TimeSlotWithStatus) => !slot.isBooked
                      ).length;
                      return availableSlotCount === 0;
                    }
                    
                    return false;
                  }
                }}
                modifiersClassNames={{
                  booked: "bg-red-100 text-red-800 hover:bg-red-100 focus:bg-red-100",
                  selected: "bg-green-600 text-white hover:bg-green-700 focus:bg-green-700"
                }}
                className="rounded-md border-gray-200 dark:border-gray-800 p-3"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Only render time and duration selectors for full booking flow */}
      {isFullProps(props) && (
        <>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Select Time</h3>
            <Select
              value={props.selectedTime}
              onValueChange={(time) => {
                props.setSelectedTime(time);
                // Auto-close dropdown when time is selected
                document.body.click(); // Hack to force close the dropdown
              }}
              disabled={!selectedDate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {availableTimeSlots.map((time) => (
                  <div key={time} className="relative">
                    <SelectItem 
                      value={time}
                      className={props.selectedTime === time ? "font-medium" : ""}
                    >
                      {time}
                      {props.selectedTime === time && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                          Selected
                        </span>
                      )}
                    </SelectItem>
                  </div>
                ))}
              </SelectContent>
            </Select>
            {isLoadingSlots && (
              <p className="text-xs text-green-600">Loading available time slots...</p>
            )}
            {slotInfo.allSlotsBooked && (
              <p className="text-xs text-amber-600">All time slots for this date are booked. Please select another date.</p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Select Duration</h3>
            <Select
              value={props.selectedDuration.toString()}
              onValueChange={(value) => {
                props.setSelectedDuration(parseInt(value));
                // Auto-close dropdown when duration is selected
                document.body.click(); // Hack to force close the dropdown
              }}
              disabled={!selectedDate || !props.selectedTime}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {/* Use the appropriate durations list based on user type */}
                {(isFullProps(props) && props.isStudent !== undefined ? 
                  (props.isStudent ? studentDurations : professionalDurations) : 
                  studentDurations).map((duration) => (
                  <SelectItem key={duration.value} value={duration.value.toString()}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
};

export default BookingCalendar;
