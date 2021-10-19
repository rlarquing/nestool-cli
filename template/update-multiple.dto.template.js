module.exports=`
import {IsNotEmpty, $validadores} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
export class UpdateMultiple$nameDto {

    @IsNotEmpty()
    @ApiProperty({ description: 'id de la $name', example: 1 })
    id: number

    $atributos
}`;