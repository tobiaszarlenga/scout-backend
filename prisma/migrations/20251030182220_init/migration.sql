BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [rol] NVARCHAR(1000) NOT NULL CONSTRAINT [User_rol_df] DEFAULT 'USER',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

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

-- CreateTable
CREATE TABLE [dbo].[pitchers] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [apellido] NVARCHAR(1000) NOT NULL,
    [edad] INT NOT NULL,
    [numero_camiseta] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [pitchers_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [equipoId] INT NOT NULL,
    CONSTRAINT [pitchers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[partidos] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fecha] DATETIME2 NOT NULL,
    [horario] NVARCHAR(1000) NOT NULL,
    [campo] NVARCHAR(1000),
    [estado] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [partidos_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [autorId] INT NOT NULL,
    [equipoLocalId] INT NOT NULL,
    [equipoVisitanteId] INT NOT NULL,
    [pitcherLocalId] INT NOT NULL,
    [pitcherVisitanteId] INT NOT NULL,
    CONSTRAINT [partidos_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[tipos_lanzamiento] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [tipos_lanzamiento_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [tipos_lanzamiento_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[resultados_lanzamiento] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [resultados_lanzamiento_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [resultados_lanzamiento_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[lanzamientos] (
    [id] INT NOT NULL IDENTITY(1,1),
    [velocidad] FLOAT(53),
    [x] INT NOT NULL,
    [y] INT NOT NULL,
    [comentario] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [lanzamientos_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [partidoId] INT NOT NULL,
    [tipoId] INT NOT NULL,
    [resultadoId] INT NOT NULL,
    CONSTRAINT [lanzamientos_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Equipo] ADD CONSTRAINT [Equipo_autorId_fkey] FOREIGN KEY ([autorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[pitchers] ADD CONSTRAINT [pitchers_equipoId_fkey] FOREIGN KEY ([equipoId]) REFERENCES [dbo].[Equipo]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[partidos] ADD CONSTRAINT [partidos_autorId_fkey] FOREIGN KEY ([autorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[partidos] ADD CONSTRAINT [partidos_equipoLocalId_fkey] FOREIGN KEY ([equipoLocalId]) REFERENCES [dbo].[Equipo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[partidos] ADD CONSTRAINT [partidos_equipoVisitanteId_fkey] FOREIGN KEY ([equipoVisitanteId]) REFERENCES [dbo].[Equipo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[partidos] ADD CONSTRAINT [partidos_pitcherLocalId_fkey] FOREIGN KEY ([pitcherLocalId]) REFERENCES [dbo].[pitchers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[partidos] ADD CONSTRAINT [partidos_pitcherVisitanteId_fkey] FOREIGN KEY ([pitcherVisitanteId]) REFERENCES [dbo].[pitchers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[lanzamientos] ADD CONSTRAINT [lanzamientos_partidoId_fkey] FOREIGN KEY ([partidoId]) REFERENCES [dbo].[partidos]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[lanzamientos] ADD CONSTRAINT [lanzamientos_tipoId_fkey] FOREIGN KEY ([tipoId]) REFERENCES [dbo].[tipos_lanzamiento]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[lanzamientos] ADD CONSTRAINT [lanzamientos_resultadoId_fkey] FOREIGN KEY ([resultadoId]) REFERENCES [dbo].[resultados_lanzamiento]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
