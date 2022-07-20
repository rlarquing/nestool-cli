module.exports=`
import {Injectable} from '@nestjs/common';
import {$nameEntity} from '../../persistence/entity';
import {$nameRepository} from "../../persistence/repository";
import {$nameMapper} from "../mapper";
import {TrazaService} from "./traza.service";
import {GenericService} from "./generic.service";

@Injectable()
export class $nameService extends GenericService<$nameEntity> {
    constructor(
        protected $paramRepository: $nameRepository,
        protected $paramMapper: $nameMapper,
        protected trazaService: TrazaService,
    ) {
        super($paramRepository, $paramMapper, trazaService, $traza);
    }
}`;