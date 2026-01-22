import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { DashboardQueryService } from './query.service';

@Injectable()
export class DashboardService {

  constructor(
    private readonly dashboardQueryService: DashboardQueryService
  ) { }

  async getMetrics(user_id: string) {
    return {
      daily: await this.getTodaysMetrics(user_id),
      weekly: await this.getThisWeeksMetrics(user_id),
      monthly: await this.getThisMonthsMetrics(user_id),
      dailyAggregates: await this.getDailySum(user_id),
      weeklyAggregates: await this.getWeeklySum(user_id),
      monthlyAggregates: await this.getMonthlySum(user_id)
    };
  }

  async getTodaysMetrics(user_id: string) {
    const todayDate = dayjs();
    const yesterdayDate = dayjs().subtract(1, "day");

    const [today, yesterday] = await Promise.all([
      this.dashboardQueryService.getTotalForDay(
        user_id,
        todayDate.format("YYYY-MM-DD")
      ),
      this.dashboardQueryService.getTotalForDay(
        user_id,
        yesterdayDate.format("YYYY-MM-DD") // Also fixed the bug here
      )
    ]);

    const percentDiff = Number(yesterday) == 0 ? null : ((Number(today) - Number(yesterday)) / Number(yesterday)) * 100;

    return {
      today: today,
      yesterday: yesterday,
      percent: percentDiff !== null ? Math.abs(percentDiff) : null,
      trend: percentDiff !== null ? (percentDiff < 0 ? "decrease" : "increase") : "neutral",
    };
  }

  async getThisWeeksMetrics(user_id: string) {
    const todaysDate = dayjs();
    const prevWeekDate = todaysDate.startOf("week").subtract(1, "day");
    const thisWeek = await this.dashboardQueryService.getTotalForWeek(
      user_id,
      todaysDate.format("YYYY-MM-DD")
    );
    const prevWeek = await this.dashboardQueryService.getTotalForWeek(
      user_id,
      prevWeekDate.format("YYYY-MM-DD")
    );

    const percentDiff = Number(prevWeek) == 0 ? null : ((Number(thisWeek) - Number(prevWeek)) / Number(prevWeek)) * 100;

    return {
      thisWeek: thisWeek,
      prevWeek: prevWeek,
      percent: percentDiff,
      trend: percentDiff !== null ? (percentDiff < 0 ? "decrease" : "increase") : "neutral",
    };
  }

  async getThisMonthsMetrics(user_id: string) {
    const todaysDate = dayjs();
    const prevMonthDate = todaysDate.startOf("month").subtract(1, "day");
    const thisMonth = await this.dashboardQueryService.getTotalForMonth(
      user_id,
      todaysDate.format("YYYY-MM-DD")
    );
    const prevMonth = await this.dashboardQueryService.getTotalForMonth(
      user_id,
      prevMonthDate.format("YYYY-MM-DD")
    );

    const percentDiff = Number(prevMonth) == 0 ? null : ((Number(thisMonth) - Number(prevMonth)) / Number(prevMonth)) * 100;


    return {
      thisMonth: thisMonth,
      prevMonth: prevMonth,
      percent: percentDiff !== null ? percentDiff : null,
      trend: percentDiff !== null ? (percentDiff < 0 ? "decrease" : "increase") : "neutral",
    };
  }

  async getDailySum(user_id: string) {
    return await this.dashboardQueryService.getDailySum(user_id);
  }

  async getWeeklySum(user_id: string) {
    return await this.dashboardQueryService.getWeeklySum(user_id);
  }

  async getMonthlySum(user_id: string) {
    return await this.dashboardQueryService.getMonthlySum(user_id);
  }
}


