export interface VacationAnalytics {
    totalVacations: number;
    currentlyOnVacation: number;
    vacationsByStatus: {
        status: string;
        count: number;
    }[];
    vacationsByMonth: {
        month: string;
        count: number;
    }[];
    vacationsByWorkLocation: {
        location: string;
        count: number;
        userNames?: string[];
    }[];
    approvalRate: number;
    averageApprovalTime: number;
    criticalPeriods: {
        startDate: string;
        endDate: string;
        count: number;
        userNames?: string[];
    }[];
}
export interface RequestAnalytics {
    totalRequests: number;
    requestsByType: {
        type: string;
        count: number;
    }[];
    requestsByStatus: {
        status: string;
        count: number;
    }[];
    requestsByMonth: {
        month: string;
        count: number;
    }[];
    averageProcessingTime: number;
}
export interface MedicalLeaveAnalytics {
    totalLeaves: number;
    leavesByStatus: {
        status: string;
        count: number;
    }[];
    leavesByMonth: {
        month: string;
        count: number;
    }[];
    leavesByWorkLocation: {
        location: string;
        count: number;
    }[];
    leavesByType: {
        type: string;
        count: number;
    }[];
    averageProcessingTime: number;
    processingTimeByMonth: {
        month: string;
        days: number;
    }[];
}
export interface ManagementAnalytics {
    absenteeismRate: {
        unit: string;
        rate: number;
    }[];
    processingTimes: {
        type: string;
        averageDays: number;
    }[];
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
export declare function getRequestAnalytics(userId?: number): Promise<RequestAnalytics>;
export declare function getMedicalLeaveAnalytics(userId?: number): Promise<MedicalLeaveAnalytics>;
export declare function getVacationAnalytics(userId?: number): Promise<VacationAnalytics>;
export declare function getManagementAnalytics(): Promise<ManagementAnalytics>;
//# sourceMappingURL=analytics.d.ts.map