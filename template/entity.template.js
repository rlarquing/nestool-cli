const genericEntity=`
import {Column, Entity, $typeorm} from "typeorm";
import {GenericEntity} from "../../shared/entity";
$import

@Entity('$entidad', { schema: '$schema' })
export class $nameEntity extends GenericEntity {

    $atributos

    constructor($parametros) {
        super();
        $thisAtributos
    }

    toString(): string {
        return '';
    }
}
`;
const genericNomencladorEntity=`
import {Entity} from "typeorm";
import {GenericNomencladorEntity} from "./generic-nomenclador.entity";

@Entity('nom_$entidad', { schema: '$schema' })
export class $nameEntity extends GenericNomencladorEntity {
}
`;
module.exports={genericEntity,genericNomencladorEntity}