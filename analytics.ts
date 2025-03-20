import { db } from "../db";
import { users, requests, medicalLeaves, vacationPeriods } from "../../shared/schema.js";
import { sql, eq, and } from "drizzle-orm";

// Modificando a interface VacationAnalytics para incluir nomes de usuários
export interface VacationAnalytics {
  totalVacations: number;
  currentlyOnVacation: number;
  vacationsByStatus: { status: string; count: number }[];
  vacationsByMonth: { month: string; count: number }[];
  vacationsByWorkLocation: { location: string; count: number; userNames?: string[] }[];
  approvalRate: number;
  averageApprovalTime: number;
  criticalPeriods: { startDate: string; endDate: string; count: number; userNames?: string[] }[];
}

// Adicionando userId opcional nas interfaces
export interface RequestAnalytics {
  totalRequests: number;
  requestsByType: { type: string; count: number }[];
  requestsByStatus: { status: string; count: number }[];
  requestsByMonth: { month: string; count: number }[];
  averageProcessingTime: number;
}

export interface MedicalLeaveAnalytics {
  totalLeaves: number;
  leavesByStatus: { status: string; count: number }[];
  leavesByMonth: { month: string; count: number }[];
  leavesByWorkLocation: { location: string; count: number }[];
  leavesByType: { type: string; count: number }[];
  averageProcessingTime: number;
  processingTimeByMonth: { month: string; days: number }[];
}

export interface ManagementAnalytics {
  absenteeismRate: { unit: string; rate: number }[];
  processingTimes: { type: string; averageDays: number }[];
  unitOverview: {
    unit: string;
    totalEmployees: number;
    currentlyAbsent: number;
    plannedAbsences: number;
  }[];
  criticalAlerts: {
    type: string;
    message: string;
    affectedUnits: string[];
    startDate: string;
    endDate: string;
  }[];
}

// Modificando as funções para aceitar userId opcional e corrigindo os erros de TypeScript
export async function getRequestAnalytics(userId?: number): Promise<RequestAnalytics> {
  // Criar a consulta base adequada
  const baseQuery = userId ? 
    db.select().from(requests).where(eq(requests.userId, userId)) : 
    db.select().from(requests);

  // Obter estatísticas gerais
  const statsResult = await db
    .select({
      totalRequests: sql<number>`count(*)`,
      averageProcessingTime: sql<number>`
        avg(case 
          when status != 'pending' 
          then extract(epoch from (updated_at - created_at))/86400.0 
          else null 
        end)
      `,
    })
    .from(requests)
    .where(userId ? eq(requests.userId, userId) : undefined);

  const stats = statsResult[0];

  // Obter dados por tipo de solicitação
  const requestsByType = await db
    .select({
      type: requests.type,
      count: sql<number>`count(*)`,
    })
    .from(requests)
    .where(userId ? eq(requests.userId, userId) : undefined)
    .groupBy(requests.type);

  // Obter dados por status
  const requestsByStatus = await db
    .select({
      status: requests.status,
      count: sql<number>`count(*)`,
    })
    .from(requests)
    .where(userId ? eq(requests.userId, userId) : undefined)
    .groupBy(requests.status);

  // Obter dados por mês
  const requestsByMonth = await db
    .select({
      month: sql<string>`to_char(created_at, 'YYYY-MM')`,
      count: sql<number>`count(*)`,
    })
    .from(requests)
    .where(userId ? eq(requests.userId, userId) : undefined)
    .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM')`);

  return {
    totalRequests: Number(stats.totalRequests),
    requestsByType: requestsByType.map(r => ({
      type: r.type,
      count: Number(r.count)
    })),
    requestsByStatus: requestsByStatus.map(r => ({
      status: r.status,
      count: Number(r.count)
    })),
    requestsByMonth: requestsByMonth.map(r => ({
      month: r.month,
      count: Number(r.count)
    })),
    averageProcessingTime: Number(stats.averageProcessingTime) || 0,
  };
}

export async function getMedicalLeaveAnalytics(userId?: number): Promise<MedicalLeaveAnalytics> {
  const whereClause = userId ? eq(medicalLeaves.userId, userId) : undefined;

  // Obter estatísticas gerais
  const statsResult = await db
    .select({
      totalLeaves: sql<number>`count(*)`,
      averageProcessingTime: sql<number>`
        avg(case 
          when status != 'pending' 
          then extract(epoch from (reviewed_at - created_at))/86400.0 
          else null 
        end)
      `,
    })
    .from(medicalLeaves)
    .where(whereClause);

  const stats = statsResult[0];

  // Obter dados por status
  const leavesByStatus = await db
    .select({
      status: medicalLeaves.status,
      count: sql<number>`count(*)`,
    })
    .from(medicalLeaves)
    .where(whereClause)
    .groupBy(medicalLeaves.status);

  // Obter dados por mês
  const leavesByMonth = await db
    .select({
      month: sql<string>`to_char(created_at, 'YYYY-MM')`,
      count: sql<number>`count(*)`,
    })
    .from(medicalLeaves)
    .where(whereClause)
    .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM')`);

  // Obter dados por localização de trabalho
  const leavesByWorkLocation = await db
    .select({
      location: users.workLocation,
      count: sql<number>`count(distinct ${medicalLeaves.userId})`,
    })
    .from(medicalLeaves)
    .innerJoin(users, eq(medicalLeaves.userId, users.id))
    .where(whereClause)
    .groupBy(users.workLocation);

  // Obter dados por tipo de licença médica
  const leavesByType = await db
    .select({
      type: medicalLeaves.leaveType,
      count: sql<number>`count(*)`,
    })
    .from(medicalLeaves)
    .where(whereClause)
    .groupBy(medicalLeaves.leaveType);

  // Obter tempo de processamento por mês
  const processingTimeByMonth = await db
    .select({
      month: sql<string>`to_char(created_at, 'YYYY-MM')`,
      days: sql<number>`
        avg(case 
          when status != 'pending' 
          then extract(epoch from (reviewed_at - created_at))/86400.0 
          else null 
        end)
      `,
    })
    .from(medicalLeaves)
    .where(whereClause)
    .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM')`);

  return {
    totalLeaves: Number(stats.totalLeaves),
    leavesByStatus: leavesByStatus.map(r => ({
      status: r.status,
      count: Number(r.count)
    })),
    leavesByMonth: leavesByMonth.map(r => ({
      month: r.month,
      count: Number(r.count)
    })),
    leavesByWorkLocation: leavesByWorkLocation.map(r => ({
      location: r.location,
      count: Number(r.count)
    })),
    leavesByType: leavesByType.map(r => ({
      type: r.type,
      count: Number(r.count)
    })),
    averageProcessingTime: Number(stats.averageProcessingTime) || 0,
    processingTimeByMonth: processingTimeByMonth.map(r => ({
      month: r.month,
      days: Number(r.days) || 0
    })),
  };
}

export async function getVacationAnalytics(userId?: number): Promise<VacationAnalytics> {
  const whereClause = userId ? eq(vacationPeriods.userId, userId) : undefined;
  const today = new Date().toISOString();

  // Obter estatísticas gerais
  const statsResult = await db
    .select({
      totalVacations: sql<number>`count(*)`,
      currentlyOnVacation: sql<number>`
        count(case 
          when status = 'approved' 
          and ${today}::date between start_date and end_date 
          then 1 
        end)
      `,
      approvalRate: sql<number>`
        (count(case when status = 'approved' then 1 end)::float / 
        nullif(count(*), 0) * 100)
      `,
      averageApprovalTime: sql<number>`
        avg(case 
          when status = 'approved' 
          then extract(epoch from (reviewed_at - created_at))/86400.0 
          else null 
        end)
      `,
    })
    .from(vacationPeriods)
    .where(whereClause);

  const stats = statsResult[0];

  // Obter dados por status
  const vacationsByStatus = await db
    .select({
      status: vacationPeriods.status,
      count: sql<number>`count(*)`,
    })
    .from(vacationPeriods)
    .where(whereClause)
    .groupBy(vacationPeriods.status);

  // Obter dados por mês
  const vacationsByMonth = await db
    .select({
      month: sql<string>`to_char(start_date, 'YYYY-MM')`,
      count: sql<number>`count(*)`,
    })
    .from(vacationPeriods)
    .where(and(
      sql`start_date is not null`,
      whereClause
    ))
    .groupBy(sql`to_char(start_date, 'YYYY-MM')`)
    .orderBy(sql`to_char(start_date, 'YYYY-MM')`);

  // Obter dados por localização de trabalho
  const vacationsByWorkLocation = await db
    .select({
      location: users.workLocation,
      count: sql<number>`count(distinct ${vacationPeriods.userId})`,
      // Adicionando nomes de usuários por localização
      userNames: sql<string[]>`array_agg(distinct ${users.fullName})`,
    })
    .from(vacationPeriods)
    .innerJoin(users, eq(vacationPeriods.userId, users.id))
    .where(whereClause)
    .groupBy(users.workLocation);

  // Obter períodos críticos (quando muitas pessoas estão de férias ao mesmo tempo)
  const criticalPeriods = await db
    .select({
      startDate: sql<string>`to_char(start_date, 'YYYY-MM-DD')`,
      endDate: sql<string>`to_char(end_date, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)`,
      // Adicionando nomes de usuários para períodos críticos
      userNames: sql<string[]>`array_agg(${users.fullName})`,
    })
    .from(vacationPeriods)
    .leftJoin(users, eq(vacationPeriods.userId, users.id))
    .where(and(
      sql`status = 'approved'`,
      sql`start_date >= ${today}::date`,
      whereClause
    ))
    .groupBy(sql`to_char(start_date, 'YYYY-MM-DD')`, sql`to_char(end_date, 'YYYY-MM-DD')`)
    .having(sql`count(*) > 2`)
    .orderBy(sql`to_char(start_date, 'YYYY-MM-DD')`);

  return {
    totalVacations: Number(stats.totalVacations),
    currentlyOnVacation: Number(stats.currentlyOnVacation),
    approvalRate: Number(stats.approvalRate) || 0,
    averageApprovalTime: Number(stats.averageApprovalTime) || 0,
    vacationsByStatus: vacationsByStatus.map(v => ({
      status: v.status,
      count: Number(v.count)
    })),
    vacationsByMonth: vacationsByMonth.map(v => ({
      month: v.month,
      count: Number(v.count)
    })),
    vacationsByWorkLocation: vacationsByWorkLocation.map(v => ({
      location: v.location,
      count: Number(v.count),
      userNames: v.userNames || [] // Incluindo nomes de usuários
    })),
    criticalPeriods: criticalPeriods.map(v => ({
      startDate: v.startDate,
      endDate: v.endDate,
      count: Number(v.count),
      userNames: v.userNames || [] // Incluindo nomes de usuários
    })),
  };
}

// Get management analytics data
export async function getManagementAnalytics(): Promise<ManagementAnalytics> {
  const today = new Date().toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Calculate absenteeism rate by unit
  const absenteeismStats = await db
    .select({
      unit: users.workUnit,
      totalEmployees: sql<number>`count(distinct users.id)`,
      absences: sql<number>`
        count(distinct case when
          exists (
            select 1 from medical_leaves ml
            where ml.user_id = users.id
            and ml.created_at >= ${thirtyDaysAgo}::date
            and ml.status = 'approved'
          )
          or exists (
            select 1 from vacation_periods vp
            where vp.user_id = users.id
            and vp.start_date >= ${thirtyDaysAgo}::date
            and vp.status = 'approved'
          )
        then users.id end)
      `,
    })
    .from(users)
    .groupBy(users.workUnit);

  // Get processing times for different request types
  const processingTimes = await db
    .select({
      type: requests.type,
      averageDays: sql<number>`
        avg(case 
          when status != 'pending' 
          then extract(epoch from (updated_at - created_at))/86400.0 
          else null 
        end)
      `,
    })
    .from(requests)
    .groupBy(requests.type);

  // Get unit overview with current and planned absences
  const unitOverview = await db
    .select({
      unit: users.workUnit,
      totalEmployees: sql<number>`count(distinct users.id)`,
      currentlyAbsent: sql<number>`
        count(distinct case when
          exists (
            select 1 from medical_leaves ml
            where ml.user_id = users.id
            and ${today}::date between ml.issue_date and ml.end_date
            and ml.status = 'approved'
          )
          or exists (
            select 1 from vacation_periods vp
            where vp.user_id = users.id
            and ${today}::date between vp.start_date and vp.end_date
            and vp.status = 'approved'
          )
        then users.id end)
      `,
      plannedAbsences: sql<number>`
        count(distinct case when
          exists (
            select 1 from vacation_periods vp
            where vp.user_id = users.id
            and vp.start_date > ${today}::date
            and vp.status = 'approved'
          )
        then users.id end)
      `,
    })
    .from(users)
    .groupBy(users.workUnit);

  // Generate critical alerts for high absence rates
  const criticalAlerts = [];
  for (const unit of unitOverview) {
    const absentRate = (Number(unit.currentlyAbsent) / Number(unit.totalEmployees)) * 100;
    if (absentRate > 20) {
      criticalAlerts.push({
        type: 'high_absence',
        message: `Alta taxa de ausência (${absentRate.toFixed(1)}%)`,
        affectedUnits: [unit.unit],
        startDate: today,
        endDate: today,
      });
    }
  }

  return {
    absenteeismRate: absenteeismStats.map(r => ({
      unit: r.unit,
      rate: (Number(r.absences) / Number(r.totalEmployees)) * 100,
    })),
    processingTimes: processingTimes.map(p => ({
      type: p.type,
      averageDays: Number(p.averageDays) || 0,
    })),
    unitOverview: unitOverview.map(u => ({
      unit: u.unit,
      totalEmployees: Number(u.totalEmployees),
      currentlyAbsent: Number(u.currentlyAbsent),
      plannedAbsences: Number(u.plannedAbsences),
    })),
    criticalAlerts,
  };
}