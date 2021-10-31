module.exports=`
import {Column, Entity, $typeorm} from "typeorm";
import {GenericEntity} from "../../shared/entity";

@Entity('$name', { schema: '$schema' })
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