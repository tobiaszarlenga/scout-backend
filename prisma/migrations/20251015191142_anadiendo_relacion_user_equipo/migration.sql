/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_email_key];

-- AlterTable
ALTER TABLE [dbo].[User] ALTER COLUMN [email] NVARCHAR(1000) NOT NULL;
ALTER TABLE [dbo].[User] ALTER COLUMN [password] NVARCHAR(1000) NOT NULL;
ALTER TABLE [dbo].[User] ALTER COLUMN [name] NVARCHAR(1000) NOT NULL;
ALTER TABLE [dbo].[User] DROP COLUMN [role];
ALTER TABLE [dbo].[User] ADD [rol] NVARCHAR(1000) NOT NULL CONSTRAINT [User_rol_df] DEFAULT 'USER';

-- CreateTable
CREATE TABLE [dbo].[Equipo] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [ciudad] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Equipo_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [autorId] INT NOT NULL,
    CONSTRAINT [Equipo_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Equipo_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateIndex
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email]);

-- AddForeignKey
ALTER TABLE [dbo].[Equipo] ADD CONSTRAINT [Equipo_autorId_fkey] FOREIGN KEY ([autorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
