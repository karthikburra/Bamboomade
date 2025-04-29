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

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  selectedDuration: number;
  setSelectedDuration: (duration: number) => void;
}

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00"
];

const durations = [
  { value: 5, label: "5 minutes - ₹5" },
  { value: 30, label: "30 minutes - ₹1,505" },
  { value: 35, label: "35 minutes - ₹1,755" },
  { value: 60, label: "60 minutes - ₹2,505" },
  { value: 90, label: "90 minutes - ₹3,505" }
];

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  selectedDuration,
  setSelectedDuration
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Date</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
              disabled={(date) => {
                // Disable dates in the past and weekends
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const day = date.getDay();
                return date < today || day === 0 || day === 6;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Time</h3>
        <Select
          value={selectedTime}
          onValueChange={setSelectedTime}
          disabled={!selectedDate}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a time" />
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Duration</h3>
        <Select
          value={selectedDuration.toString()}
          onValueChange={(value) => setSelectedDuration(parseInt(value))}
          disabled={!selectedDate || !selectedTime}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            {durations.map((duration) => (
              <SelectItem key={duration.value} value={duration.value.toString()}>
                {duration.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default BookingCalendar;
