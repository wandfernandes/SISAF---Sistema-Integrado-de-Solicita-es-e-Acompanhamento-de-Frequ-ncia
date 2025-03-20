import { Router } from "express";
import { db } from "../db.js";
import { licenses, users } from "@shared/schema.js";
import { eq } from "drizzle-orm";
const router = Router();
// Middleware de autenticação
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            error: true,
            message: "Usuário não autenticado"
        });
    }
    next();
};
// Adicionar middleware em todas as rotas que precisam de autenticação
router.use(requireAuth);
// Buscar todas as licenças (filtradas por permissão)
router.get("/licenses", async (req, res) => {
    try {
        // Verificar se o usuário está autenticado
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                error: true,
                message: "Usuário não autenticado"
            });
        }
        // Determinar se o usuário é admin ou RH
        const isAdmin = req.user.role === "admin" || req.user.role === "hr";
        // Montar a consulta base
        let result;
        if (isAdmin) {
            // Administradores e RH podem ver todas as licenças
            result = await db
                .select({
                id: licenses.id,
                userId: licenses.userId,
                serverName: licenses.serverName,
                workUnit: licenses.workUnit,
                seiNumber: licenses.seiNumber,
                startDate: licenses.startDate,
                endDate: licenses.endDate,
                returnDate: licenses.returnDate,
                reason: licenses.reason,
                status: licenses.status,
                observation: licenses.observation,
                createdAt: licenses.createdAt,
                updatedAt: licenses.updatedAt,
                userName: users.fullName,
                userWorkUnit: users.workUnit,
            })
                .from(licenses)
                .leftJoin(users, eq(licenses.userId, users.id));
        }
        else {
            // Usuários comuns veem apenas suas próprias licenças
            result = await db
                .select({
                id: licenses.id,
                userId: licenses.userId,
                serverName: licenses.serverName,
                workUnit: licenses.workUnit,
                seiNumber: licenses.seiNumber,
                startDate: licenses.startDate,
                endDate: licenses.endDate,
                returnDate: licenses.returnDate,
                reason: licenses.reason,
                status: licenses.status,
                observation: licenses.observation,
                createdAt: licenses.createdAt,
                updatedAt: licenses.updatedAt,
                userName: users.fullName,
                userWorkUnit: users.workUnit,
            })
                .from(licenses)
                .leftJoin(users, eq(licenses.userId, users.id))
                .where(eq(licenses.userId, req.user.id));
        }
        res.json(result);
    }
    catch (error) {
        console.error("Error fetching licenses:", error);
        res.status(500).json({
            error: true,
            message: "Erro ao buscar licenças"
        });
    }
});
// Buscar licenças pendentes (apenas para admin e HR)
router.get("/licenses/pending", async (req, res) => {
    try {
        // Verificar se o usuário é admin ou HR
        if (!req.user || (req.user.role !== "admin" && req.user.role !== "hr")) {
            return res.status(403).json({
                error: true,
                message: "Apenas administradores e RH podem acessar licenças pendentes"
            });
        }
        const pendingLicenses = await db
            .select({
            id: licenses.id,
            userId: licenses.userId,
            serverName: licenses.serverName,
            workUnit: licenses.workUnit,
            seiNumber: licenses.seiNumber,
            startDate: licenses.startDate,
            endDate: licenses.endDate,
            returnDate: licenses.returnDate,
            reason: licenses.reason,
            status: licenses.status,
            observation: licenses.observation,
            createdAt: licenses.createdAt,
            updatedAt: licenses.updatedAt,
            userName: users.fullName,
            userWorkUnit: users.workUnit,
        })
            .from(licenses)
            .leftJoin(users, eq(licenses.userId, users.id))
            .where(eq(licenses.status, "pending"));
        res.json(pendingLicenses);
    }
    catch (error) {
        console.error("Error fetching pending licenses:", error);
        res.status(500).json({
            error: true,
            message: "Erro ao buscar licenças pendentes"
        });
    }
});
// Criar uma nova licença
router.post("/licenses", async (req, res) => {
    try {
        // Verificar autenticação
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                error: true,
                message: "Usuário não autenticado"
            });
        }
        const { serverName, workUnit, seiNumber, startDate, endDate, returnDate, reason, observation } = req.body;
        // Validação básica
        if (!serverName || !workUnit || !seiNumber || !startDate || !endDate || !returnDate || !reason) {
            return res.status(400).json({
                error: true,
                message: "Campos obrigatórios não preenchidos"
            });
        }
        // Inserir a nova licença
        const [license] = await db
            .insert(licenses)
            .values({
            userId: req.user.id,
            serverName,
            workUnit,
            seiNumber,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            returnDate: new Date(returnDate),
            reason,
            observation: observation || null,
            status: "pending",
        })
            .returning();
        res.status(201).json(license);
    }
    catch (error) {
        console.error("Error creating license:", error);
        res.status(500).json({
            error: true,
            message: "Erro ao criar licença: " + error.message
        });
    }
});
// Atualizar status de uma licença (apenas para admin e HR)
router.patch("/licenses/:id", async (req, res) => {
    try {
        // Verificar se o usuário é admin ou HR
        if (!req.user || (req.user.role !== "admin" && req.user.role !== "hr")) {
            return res.status(403).json({
                error: true,
                message: "Apenas administradores e RH podem atualizar licenças"
            });
        }
        const { id } = req.params;
        const { status, observation } = req.body;
        // Validação básica
        if (!status) {
            return res.status(400).json({
                error: true,
                message: "Status é obrigatório"
            });
        }
        // Atualizar a licença
        const [updatedLicense] = await db
            .update(licenses)
            .set({
            status: status,
            observation: observation || undefined,
            updatedAt: new Date(),
        })
            .where(eq(licenses.id, parseInt(id)))
            .returning();
        if (!updatedLicense) {
            return res.status(404).json({
                error: true,
                message: "Licença não encontrada"
            });
        }
        res.json(updatedLicense);
    }
    catch (error) {
        console.error("Error updating license:", error);
        res.status(500).json({
            error: true,
            message: "Erro ao atualizar licença"
        });
    }
});
// Buscar uma licença específica
router.get("/licenses/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar autenticação
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                error: true,
                message: "Usuário não autenticado"
            });
        }
        const [license] = await db
            .select({
            id: licenses.id,
            userId: licenses.userId,
            serverName: licenses.serverName,
            workUnit: licenses.workUnit,
            seiNumber: licenses.seiNumber,
            startDate: licenses.startDate,
            endDate: licenses.endDate,
            returnDate: licenses.returnDate,
            reason: licenses.reason,
            status: licenses.status,
            observation: licenses.observation,
            createdAt: licenses.createdAt,
            updatedAt: licenses.updatedAt,
            userName: users.fullName,
            userWorkUnit: users.workUnit,
        })
            .from(licenses)
            .leftJoin(users, eq(licenses.userId, users.id))
            .where(eq(licenses.id, parseInt(id)));
        if (!license) {
            return res.status(404).json({
                error: true,
                message: "Licença não encontrada"
            });
        }
        // Verificar permissão (próprio usuário ou admin/HR)
        if (license.userId !== req.user.id && req.user.role !== "admin" && req.user.role !== "hr") {
            return res.status(403).json({
                error: true,
                message: "Sem permissão para acessar esta licença"
            });
        }
        res.json(license);
    }
    catch (error) {
        console.error("Error fetching license:", error);
        res.status(500).json({
            error: true,
            message: "Erro ao buscar licença"
        });
    }
});
export default router;
//# sourceMappingURL=licenses.js.map