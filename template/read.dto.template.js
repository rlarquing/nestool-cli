module.exports=`
import {$validadores} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
export class Read$nameDto {
    @IsString({message: 'El dtoToString debe de ser un string'})
    dtoToString: string;
    @IsNumber()
    @ApiProperty({description: 'id del la $name.', example: 1})
    id: number;
    $atributos
    constructor(dtoToString: string, id: number, $parametros) {
        this.dtoToString = dtoToString;
        this.id = id;
        $thisAtributos
    }
}`;