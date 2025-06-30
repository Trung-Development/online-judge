"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { ISubmissionsData } from "@/lib/server-actions/users";
import "@/styles/activity.css";

interface ActivityHeatmapProps {
  submissions: ISubmissionsData[];
}

interface ActivityData {
  [date: string]: number;
}

export default function ActivityHeatmap({ submissions }: ActivityHeatmapProps) {
  const [activityData, setActivityData] = useState<ActivityData>({});
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [maxCount, setMaxCount] = useState<number>(0);
  
  // Container ref for the component 
  const containerRef = useRef<HTMLDivElement>(null);

  // Process submissions to get activity data
  useEffect(() => {
    const data: ActivityData = {};
    let max = 0;
    
    submissions.forEach(submission => {
      const date = new Date(Number(submission.timestamp)).toISOString().split("T")[0];
      if (!data[date]) {
        data[date] = 0;
      }
      data[date]++;
      max = Math.max(max, data[date]);
    });
    
    setActivityData(data);
    setMaxCount(max);
  }, [submissions]);

  // Calc visible year submissions total
  const visibleSubmissionsCount = useMemo(() => {
    // Initialize with 0
    let total = 0;
    
    // Extract year boundaries
    const isCurrentYear = currentYear === new Date().getFullYear();
    const startDate = isCurrentYear 
      ? new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate() + 1) 
      : new Date(currentYear, 0, 1);
    const endDate = isCurrentYear 
      ? new Date() 
      : new Date(currentYear, 11, 31);
    
    // Iterate through activityData and count submissions within the year
    Object.entries(activityData).forEach(([dateStr, count]) => {
      const submissionDate = new Date(dateStr);
      if (submissionDate >= startDate && submissionDate <= endDate) {
        total += count;
      }
    });
    
    return total;
  }, [activityData, currentYear]);

  // Generate calendar data and fill the table
  useEffect(() => {
    // Function to draw the contribution cells
    const drawContribution = (year: number) => {
      // Clear all existing cells
      document.querySelectorAll('#submission-activity-table td').forEach(el => el.remove());
      
      // Update year display
      const yearSpan = document.getElementById('year');
      if (yearSpan) {
        yearSpan.setAttribute('data-year', year.toString());
      }
      
      // Show/hide prev/next year buttons
      const prevYearAction = document.getElementById('prev-year-action');
      const nextYearAction = document.getElementById('next-year-action');
      
      if (prevYearAction) {
        prevYearAction.style.display = year > (new Date().getFullYear() - 5) ? '' : 'none';
      }
      
      if (nextYearAction) {
        nextYearAction.style.display = year < new Date().getFullYear() ? '' : 'none';
      }
      
      // Determine date range to display
      let startDate: Date, endDate: Date;
      const isCurrentYear = year === new Date().getFullYear();
      
      if (isCurrentYear) {
        // If current year, show past 365 days
        endDate = new Date();
        startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(startDate.getDate() + 1);
        
        if (yearSpan) {
          yearSpan.textContent = 'past year';
        }
      } else {
        // Otherwise show the calendar year
        startDate = new Date(year, 0, 1);
        endDate = new Date(year + 1, 0, 0);
        
        if (yearSpan) {
          yearSpan.textContent = year.toString();
        }
      }
      
      // Prepare days array with weekday and activity data
      const days: {
        date: Date;
        weekday: number;
        day_num: number; // For tooltip position calculation
        activity: number;
      }[] = [];
      
      // Generate days arr
      for (let day = new Date(startDate), day_num = 1; day <= endDate; day.setDate(day.getDate() + 1), day_num++) {
        const isodate = day.toISOString().split('T')[0];
        days.push({
          date: new Date(day),
          weekday: day.getDay(),
          day_num,
          activity: activityData[isodate] || 0,
        });
      }
      
      // Calculate sum of activity for the period
      const sumActivity = days.reduce((sum, obj) => sum + obj.activity, 0);
      
      // Update total count display
      const totalCountSpan = document.getElementById('submission-total-count');
      if (totalCountSpan) {
        totalCountSpan.textContent = `${sumActivity} total submission${sumActivity !== 1 ? 's' : ''}`;
      }
      
      // Update header text
      const headerElement = document.getElementById('submission-activity-header');
      if (headerElement) {
        if (isCurrentYear) {
          headerElement.textContent = `${sumActivity} submission${sumActivity !== 1 ? 's' : ''} in the last year`;
        } else {
          headerElement.textContent = `${sumActivity} submission${sumActivity !== 1 ? 's' : ''} in ${year}`;
        }
      }
      
      // Add blank cells for days before the first day of the month
      for (let current_weekday = 0; current_weekday < days[0].weekday; current_weekday++) {
        const row = document.getElementById(`submission-${current_weekday}`);
        if (row) {
          const blankCell = document.createElement('td');
          blankCell.className = 'activity-blank';
          const div = document.createElement('div');
          blankCell.appendChild(div);
          row.appendChild(blankCell);
        }
      }
      
      // Find maximum activity for scaling
      const maxActivity = Math.max(1, Math.max(...days.map(obj => obj.activity)));
      
      // Add activity cells
      days.forEach(obj => {
        // Calculate activity level (0-4)
        const level = Math.ceil((obj.activity / maxActivity) * 4);
        
        // Format date for tooltip
        const formattedDate = obj.date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric', 
          day: 'numeric'
        });
        
        // Create tooltip text
        const tooltipText = `${obj.activity} submission${obj.activity !== 1 ? 's' : ''} on ${formattedDate}`;
        
        // Find the correct row by weekday
        const row = document.getElementById(`submission-${obj.weekday}`);
        if (row) {
          // Create and append the cell
          const cell = document.createElement('td');
          cell.className = `activity-label activity-${level}`;
          cell.setAttribute('data-submission-activity', tooltipText);
          cell.setAttribute('data-day', obj.day_num.toString());
          
          // Add tooltip handling using pure DOM
          // Use a shared event handler for all cells
          cell.addEventListener('mouseenter', function() {
            const dayNum = parseInt(this.getAttribute('data-day') || '0');
            const tooltipDirection = dayNum < 183 ? 'tooltipped-w' : 'tooltipped-e';
            
            // Clear any existing tooltips
            document.querySelectorAll('.tooltipped').forEach(el => {
              el.classList.remove('tooltipped', 'tooltipped-e', 'tooltipped-w');
              el.removeAttribute('aria-label');
            });
            
            // Add tooltip classes to this element
            this.classList.add('tooltipped', tooltipDirection);
            this.setAttribute('aria-label', tooltipText);
          });
          
          cell.addEventListener('mouseleave', function() {
            this.classList.remove('tooltipped', 'tooltipped-e', 'tooltipped-w');
            this.removeAttribute('aria-label');
          });
          
          // Create the div inside (required for square aspect ratio)
          const div = document.createElement('div');
          cell.appendChild(div);
          
          row.appendChild(cell);
        }
      });
    };
    
    // Call the draw function with current year
    drawContribution(currentYear);
    
  }, [activityData, currentYear, maxCount, containerRef]);

  // Handle year change
  const handlePrevYear = () => {
    setCurrentYear(prev => prev - 1);
  };
  
  const handleNextYear = () => {
    const nextYear = currentYear + 1;
    if (nextYear <= new Date().getFullYear()) {
      setCurrentYear(nextYear);
    }
  };

  // No mouse event handlers needed as these are now set dynamically in the DOM

  return (
    <div className="activity-heatmap" ref={containerRef}>
      <h4 id="submission-activity-header">
        {visibleSubmissionsCount} submissions in {currentYear === new Date().getFullYear() ? 'the past year' : currentYear}
      </h4>
      
      <div id="submission-activity" style={{ display: 'block' }}>
        <div id="submission-activity-actions">
          <a 
            href="javascript:void(0)" 
            id="prev-year-action"
            onClick={handlePrevYear}
            style={{ display: currentYear <= new Date().getFullYear() - 5 ? 'none' : '' }}
          >
            &laquo;
          </a>
          &nbsp;<span id="year" data-year={currentYear}>
            {currentYear === new Date().getFullYear() ? 'past year' : currentYear}
          </span>&nbsp;
          <a 
            href="javascript:void(0)" 
            id="next-year-action"
            onClick={handleNextYear}
            style={{ display: currentYear >= new Date().getFullYear() ? 'none' : '' }}
          >
            &raquo;
          </a>
        </div>
        
        <div id="submission-activity-display">
          <table id="submission-activity-table" className="submission-activity-table" cellSpacing="1">
            <tbody>
              {/* Day of week labels in rows */}
              <tr id="submission-0">
                <th className="submission-date-col info-text">
                  Sun
                </th>
                {/* Cells will be inserted here via JS */}
              </tr>
              <tr id="submission-1">
                <th className="submission-date-col info-text">
                  Mon
                </th>
                {/* Cells will be inserted here via JS */}
              </tr>
              <tr id="submission-2">
                <th className="submission-date-col info-text">
                  Tue
                </th>
                {/* Cells will be inserted here via JS */}
              </tr>
              <tr id="submission-3">
                <th className="submission-date-col info-text">
                  Wed
                </th>
                {/* Cells will be inserted here via JS */}
              </tr>
              <tr id="submission-4">
                <th className="submission-date-col info-text">
                  Thu
                </th>
                {/* Cells will be inserted here via JS */}
              </tr>
              <tr id="submission-5">
                <th className="submission-date-col info-text">
                  Fri
                </th>
                {/* Cells will be inserted here via JS */}
              </tr>
              <tr id="submission-6">
                <th className="submission-date-col info-text">
                  Sat
                </th>
                {/* Cells will be inserted here via JS */}
              </tr>
            </tbody>
          </table>
          
          <div className="info-bar">
            <span id="submission-total-count" className="info-text">
              {visibleSubmissionsCount} total submissions
            </span>
            <table className="info-table" cellSpacing="1">
              <tbody>
                <tr>
                  <th className="info-table-text info-text">Less</th>
                  <td className="activity-0"><div></div></td>
                  <td className="activity-1"><div></div></td>
                  <td className="activity-2"><div></div></td>
                  <td className="activity-3"><div></div></td>
                  <td className="activity-4"><div></div></td>
                  <th className="info-table-text info-text">More</th>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
