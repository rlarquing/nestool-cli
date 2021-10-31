module.exports=`
import {Column, Entity, $typeorm} from "typeorm";
import {GenericEntity} from "../../shared/entity";
$import

@Entity('$entidad', { schema: '$schema' })
export class $nameEntity extends GenericEntity {

    $atriburos

    constructor($parametros) {
        super();
        $thisAtributos
    }

    toString(): string {
        return '';
    }
}
`;