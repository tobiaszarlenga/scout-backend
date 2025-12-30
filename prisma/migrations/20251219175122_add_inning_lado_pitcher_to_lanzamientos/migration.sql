/*
  Warnings:

  - Added the required column `inning` to the `lanzamientos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ladoInning` to the `lanzamientos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pitcherId` to the `lanzamientos` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[lanzamientos] DROP CONSTRAINT [lanzamientos_partidoId_fkey];

-- AlterTable
ALTER TABLE [dbo].[lanzamientos] ADD [inning] INT NOT NULL,
[ladoInning] NVARCHAR(1000) NOT NULL,
[pitcherId] INT NOT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[lanzamientos] ADD CONSTRAINT [lanzamientos_pitcherId_fkey] FOREIGN KEY ([pitcherId]) REFERENCES [dbo].[pitchers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[lanzamientos] ADD CONSTRAINT [lanzamientos_partidoId_fkey] FOREIGN KEY ([partidoId]) REFERENCES [dbo].[partidos]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
