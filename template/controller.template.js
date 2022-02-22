module.exports=`import {Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UsePipes, ValidationPipe} from '@nestjs/common';
import {Create$nameDto, Read$nameDto, UpdateMultiple$nameDto, Update$nameDto} from '../dto';
import {$nameService} from '../service';
import {GetUser, Roles, Servicio} from "../../security/decorator";
import {RolType} from "../../security/enum/rol-type.enum";
import {AuthGuard} from "@nestjs/passport";
import {UserEntity} from "../../security/entity";
import {$nameEntity, UserEntity} from "../entity";
import {ConfigService} from "@nestjs/config";
import {ApiBearerAuth, ApiBody, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {GenericController} from "../../shared/controller";
import {BadRequestDto, BuscarDto, FiltroGenericoDto, ListadoDto, ResponseDto} from "../../shared/dto";
import {PermissionGuard} from '../../security/guard';
$import

@ApiTags('$tag')
@Controller('$paraCont')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class $nameController extends GenericController<$nameEntity> {
    constructor(
        protected $paramService: $nameService,
    protected configService: ConfigService
) {
    super($paramService, configService, '$paraCont', $nameController);
}

@Get()
@Roles(RolType.ADMINISTRADOR)//El decorador roles no trabaja arriba en la cabeza del controlador.
@ApiOperation({summary: 'Obtener el listado de elementos del conjunto'})
@ApiResponse({
    status: 200,
    description: 'Listado de elementos del conjunto',
    type: ListadoDto,
})
@ApiNotFoundResponse({
    status: 404,
    description: 'Elementos del conjunto no encontrados.',
})
@ApiResponse({status: 401, description: 'Sin autorizacion.'})
@ApiResponse({status: 403, description: 'Sin autorizacion al recurso.'})
@ApiResponse({status: 500, description: 'Error interno del servidor.'})
@Servicio($nameController.name, 'findAll')
async findAll(
    @Query('page') page: number = 1,
@Query('limit') limit: number = 10): Promise<any> {
    const data = await super.findAll(page, limit);
    const header: string[] = ['id', $header];
return new ListadoDto(header, data);
}

@Get(':id')
@ApiOperation({summary: 'Obtener un elemento del conjunto'})
@ApiResponse({
    status: 200,
    description: 'Muestra la información de un elemento del conjunto',
    type: Read$nameDto,
})
@ApiNotFoundResponse({
    status: 404,
    description: 'Elemento del conjunto no encontrado.',
})
@ApiResponse({status: 401, description: 'Sin autorizacion.'})
@ApiResponse({status: 403, description: 'Sin autorizacion al recurso.'})
@ApiResponse({status: 500, description: 'Error interno del servidor.'})
@Servicio($nameController.name, 'findById')
async findById(@Param('id', ParseIntPipe) id: number): Promise<Read$nameDto> {
    return await super.findById(id);
}

@Post('/elementos/multiples')
@ApiOperation({summary: 'Obtener multiples elementos del conjunto'})
@ApiBody({
    description: 'Estructura para mostrar los multiples elementos del conjunto.',
    type: [Number],
})
@ApiResponse({
    status: 200,
    description: 'Muestra la información de multiples elementos del conjunto',
    type: [Read$nameDto],
})
@ApiNotFoundResponse({
    status: 404,
    description: 'Elementos del conjunto no encontrados.',
})
@ApiResponse({status: 401, description: 'Sin autorizacion.'})
@ApiResponse({status: 403, description: 'Sin autorizacion al recurso.'})
@ApiResponse({status: 500, description: 'Error interno del servidor.'})
@Servicio($nameController.name, 'findByIds')
async findByIds(@Body() ids: number[]): Promise<Read$nameDto[]> {
    return await super.findByIds(ids);
}

@Post()
@ApiOperation({summary: 'Crear un elemento del conjunto.'})
@ApiBody({
    description: 'Estructura para crear el elemento del conjunto.',
    type: Create$nameDto,
})
@ApiResponse({status: 201, description: 'Crea un elemento del conjunto.', type: ResponseDto})
@ApiResponse({status: 401, description: 'Sin autorizacion.'})
@ApiResponse({status: 403, description: 'Sin autorizacion al recurso.'})
@ApiResponse({status: 500, description: 'Error interno del servidor.'})
@ApiResponse({status: 400, description: 'Solicitud con errores.',type: BadRequestDto})
@Servicio($nameController.name, 'create')
async create(@GetUser() user: UserEntity, @Body() create$nameDto: Create$nameDto): Promise<ResponseDto> {
    return await super.create(user, create$nameDto);
}

@Post('/multiple')
@ApiOperation({summary: 'Crear un grupo de elementos del conjunto.'})
@ApiBody({
    description: 'Estructura para crear el grupo de elementos del conjunto.',
    type: [Create$nameDto],
})
@ApiResponse({status: 201, description: 'Crea un grupo de elementos del conjunto.', type: ResponseDto})
@ApiResponse({status: 401, description: 'Sin autorizacion.'})
@ApiResponse({status: 403, description: 'Sin autorizacion al recurso.'})
@ApiResponse({status: 500, description: 'Error interno del servidor.'})
@ApiResponse({status: 400, description: 'Solicitud con errores.',type: BadRequestDto})
@Servicio($nameController.name, 'createMultiple')
async createMultiple(@GetUser() user: UserEntity, @Body() create$nameDto: Create$nameDto[]): Promise<ResponseDto[]> {
    return await super.createMultiple(user, create$nameDto);
}

@Post('/importar/elementos')
@ApiOperation({summary: 'Importar un grupo de elementos del conjunto.'})
@ApiBody({
    description: 'Estructura para crear el grupo de elementos del conjunto.',
    type: [Create$nameDto],
})
@ApiResponse({status: 201, description: 'Crea un grupo de elementos del conjunto.', type: ResponseDto})
@ApiResponse({status: 401, description: 'Sin autorizacion.'})
@ApiResponse({status: 403, description: 'Sin autorizacion al recurso.'})
@ApiResponse({status: 500, description: 'Error interno del servidor.'})
@ApiResponse({status: 400, description: 'Solicitud con errores.',type: BadRequestDto})
@Servicio($nameController.name, 'importar')
async importar(@GetUser() user: UserEntity, @Body() create$nameDto: Create$nameDto[]): Promise<ResponseDto[]> {
    return await super.importar(user, create$nameDto);
}

@Patch(':id')
@ApiOperation({summary: 'Actualizar un elemento del conjunto.'})
@ApiBody({
    description: 'Estructura para modificar el elemento del conjunto.',
    type: Update$nameDto,
})
@ApiResponse({status: 201, description: 'El elemento se ha actualizado.', type: ResponseDto})
@ApiResponse({status: 401, description: 'Sin autorizacion.'})
@ApiResponse({status: 403, description: 'Sin autorizacion al recurso.'})
@ApiResponse({status: 500, description: 'Error interno del servidor.'})
@ApiResponse({status: 400, description: 'Solicitud con errores.',type: BadRequestDto})
@Servicio($nameController.name, 'update')
async update(@GetUser() user: UserEntity, @Param('id', ParseIntPipe) id: number, @Body() update$nameDto: Update$nameDto): Promise<ResponseDto> {
    return await super.update(user, id, update$nameDto);
}

@Patch('/elementos/multiples')
@ApiOperation({summary: 'Actualizar un grupo de elementos del conjunto.'})
@ApiBody({
    description: 'Estructura para modificar el grupo de elementos del conjunto.',
    type: [UpdateMultiple$nameDto],
})
@ApiResponse({status: 201, description: 'El grupo de elementos se han actualizado.', type: ResponseDto})
@ApiResponse({status: 401, description: 'Sin autorizacion.'})
@ApiResponse({status: 403, description: 'Sin autorizacion al recurso.'})
@ApiResponse({status: 500, description: 'Error interno del servidor.'})
@ApiResponse({status: 400, description: 'Solicitud con errores.',type: BadRequestDto})
@Servicio($nameController.name, 'updateMultiple')
async updateMultiple(@GetUser() user: UserEntity, @Body() updateMultiple$nameeDto: UpdateMultiple$nameDto[]): Promise<ResponseDto> {
    return await super.updateMultiple(user, updateMultiple$nameeDto);
}

@Post('filtrar')
@ApiOperation({summary: 'Filtrar el conjunto por los parametros establecidos'})
@ApiResponse({
    status: 201,
    description: 'Filtra el conjunto por los parametros que se le puedan pasar',
    type: ListadoDto,
})
@ApiBody({
    description: 'Estructura para crear el filtrado.',
    type: FiltroGenericoDto
})
@ApiResponse({status: 401, description: 'Sin autorizacion.'})
@ApiResponse({status: 403, description: 'Sin autorizacion al recurso.'})
@ApiResponse({status: 500, description: 'Error interno del servidor.'})
@Servicio($nameController.name, 'filter')
async filter(@Query('page') page: number = 1,
@Query('limit') limit: number = 10,
@Body() filtroGenericoDto: FiltroGenericoDto): Promise<any> {
    const data = await super.filter(page, limit, filtroGenericoDto);
    const header: string[] = ['id', $header];
return new ListadoDto(header, data);
}
@Post('buscar')
@ApiOperation({summary: 'Buscar en el conjunto por el parametro establecido'})
@ApiResponse({
    status: 201,
    description: 'Busca en el conjunto en el parametros establecido',
    type: ListadoDto,
})
@ApiBody({
    description: 'Estructura para crear la busqueda.',
    type: String
})
@ApiResponse({status: 401, description: 'Sin autorizacion.'})
@ApiResponse({status: 403, description: 'Sin autorizacion al recurso.'})
@ApiResponse({status: 500, description: 'Error interno del servidor.'})
@Servicio($nameController.name, 'search')
async search(@Query('page') page: number = 1,
@Query('limit') limit: number = 10,
@Body() buscarDto: BuscarDto): Promise<any> {
    const data = await super.search(page, limit, buscarDto);
    const header: string[] = ['id', $header];
return new ListadoDto(header, data);
}
}
`;