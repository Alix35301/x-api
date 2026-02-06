import dayjs from "dayjs";
import { DataSource, Repository } from "typeorm";
import { Expense } from "../expense/entities/expense.entity";
import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class DashboardQueryService {

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @InjectRepository(Expense)
    private repo: Repository<Expense>
  ) {

  }

  async getTotalForDay(user_id: string, date: string) {
    const result = await this.repo
      .createQueryBuilder("expense")
      .select("SUM(expense.amount)", "total")
      .where("expense.user_id = :user_id", { user_id })
      .andWhere("expense.date = :date", { date })
      .andWhere("expense.deleted_at IS NULL")
      .getRawOne();
    const total = Number(result?.total || 0);

    return total;
  }

  async getTotalForWeek(user_id: string, date: string) {
    const start = dayjs(date).startOf("week").toDate();
    const end = dayjs(date).endOf("week").toDate();

    const result = await this.dataSource.getRepository(Expense)
      .createQueryBuilder("expense")
      .select("SUM(expense.amount)", "total")
      .where("expense.user_id = :user_id", { user_id })
      .andWhere("expense.date BETWEEN :start AND :end", { start, end })
      .andWhere("expense.deleted_at IS NULL")
      .getRawOne();

    const total = Number(result?.total || 0);

    return total;
  }

  async getTotalForMonth(user_id: string, date: string) {
    const start = dayjs(date).startOf("month").toDate();
    const end = dayjs(date).endOf("month").toDate();

    const result = await this.dataSource.getRepository(Expense)
      .createQueryBuilder("expense")
      .select("SUM(expense.amount)", "total")
      .where("expense.user_id = :user_id", { user_id })
      .andWhere("expense.date BETWEEN :start AND :end", { start, end })
      .andWhere("expense.deleted_at IS NULL")
      .getRawOne();

    const total = Number(result?.total || 0);

    return total;
  }

  async getDailySum(user_id: string) {
    const end = dayjs();
    const start = dayjs(end).subtract(1, "month");

    const result = await this.dataSource.getRepository(Expense)
      .createQueryBuilder("expense")
      .where("expense.user_id = :user_id", { user_id })
      .andWhere("expense.deleted_at IS NULL")
      .select("DATE(expense.date)", "date")
      .groupBy("DATE(expense.date)")
      .addSelect("SUM(expense.amount)", "total")
      .andWhere("expense.date BETWEEN :start AND :end", {
        start: start.format("YYYY-MM-DD"),
        end: end.format("YYYY-MM-DD"),
      })
      .getRawMany();

    return result;
  }

  async getWeeklySum(user_id: string, weeks: number = 14) {
    const result = await this.dataSource.getRepository(Expense)
      .createQueryBuilder("expense")
      .where("expense.user_id = :user_id", { user_id })
      .andWhere("expense.deleted_at IS NULL")
      .select("YEAR(expense.date)", "year")
      .addSelect("WEEK(expense.date)", "week")
      .groupBy("YEAR(expense.date)")
      .addGroupBy("WEEK(expense.date)")
      .addSelect("SUM(expense.amount)", "total")
      .orderBy("year")
      .addOrderBy("week")
      .limit(weeks)
      .getRawMany();

    return result;
  }

  async getMonthlySum(user_id: string, months: number = 6) {
    const result = await this.dataSource.getRepository(Expense)
      .createQueryBuilder("expense")
      .where("expense.user_id = :user_id", { user_id })
      .andWhere("expense.deleted_at IS NULL")
      .select("YEAR(expense.date)", "year")
      .addSelect("MONTH(expense.date)", "month")
      .groupBy("YEAR(expense.date)")
      .addGroupBy("MONTH(expense.date)")
      .addSelect("SUM(expense.amount)", "total")
      .orderBy("year")
      .addOrderBy("month")
      .limit(months)
      .getRawMany();

    return result;
  }

  async getLastExpenseDate(user_id: string): Promise<Date | null> {
    const result = await this.repo
      .createQueryBuilder("expense")
      .select("MAX(expense.date)", "lastDate")
      .where("expense.user_id = :user_id", { user_id })
      .andWhere("expense.deleted_at IS NULL")
      .getRawOne();

    return result?.lastDate || null;
  }
}
