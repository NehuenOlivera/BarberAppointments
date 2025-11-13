import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Verificar si un nuevo bloque se solapa con otros
const checkOverlap = async (barberId: number, weekday: number, startHour: string, endHour: string, excludeId?: number) => {
  return await prisma.availability.findFirst({
    where: {
      barberId,
      weekday,
      id: excludeId ? { not: excludeId } : undefined,
      AND: [
        { startHour: { lt: endHour } },
        { endHour: { gt: startHour } },
      ],
    },
  });
};

// Crear nueva disponibilidad
export const createAvailability = async (barberId: number, weekday: number, startHour: string, endHour: string) => {
  const overlap = await checkOverlap(barberId, weekday, startHour, endHour);
  if (overlap) {
    throw new Error(`Time overlaps with existing availability (${overlap.startHour} - ${overlap.endHour})`);
  }

  return prisma.availability.create({
    data: { barberId, weekday, startHour, endHour },
  });
};

// Actualizar disponibilidad existente
export const updateAvailability = async (id: number, startHour: string, endHour: string, weekday: number) => {
  const current = await prisma.availability.findUnique({ where: { id } });
  if (!current) throw new Error("Availability not found");

  const overlap = await checkOverlap(current.barberId, weekday, startHour, endHour, id);
  if (overlap) {
    throw new Error(`Time overlaps with existing availability (${overlap.startHour} - ${overlap.endHour})`);
  }

  return prisma.availability.update({
    where: { id },
    data: { startHour, endHour, weekday },
  });
};

// Eliminar disponibilidad
export const deleteAvailability = async (id: number) => {
  return prisma.availability.delete({ where: { id } });
};

// Obtener disponibilidades de un barbero
export const getAvailabilitiesByBarber = async (barberId: number) => {
  return prisma.availability.findMany({ where: { barberId } });
};