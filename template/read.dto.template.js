module.exports=`import {ApiProperty} from "@nestjs/swagger";
$import
export class Read$nameDto {
    @ApiProperty({ description: 'Nombre del objeto', example: 'Objeto 1' })
    dtoToString: string;
    @ApiProperty({description: 'id de la entidad.', example: 1})
    id: number;
    $atributos
    constructor(dtoToString: string, id: number, $parametros) {
        this.dtoToString = dtoToString;
        this.id = id;
        $thisAtributos
    }
}`;