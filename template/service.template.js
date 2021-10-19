module.exports=`
import {Injectable} from '@nestjs/common';
import {$nameEntity} from '../entity';
import {$nameRepository} from "../repository";
import {$nameMapper} from "../mapper";
import {TrazaService} from "../../security/service";
import {GenericService} from "../../shared/service";

@Injectable()
export class $nameService extends GenericService<$nameEntity> {
    constructor(
        protected $nameParamRepository: $nameRepository,
        protected $nameParamMapper: $nameMapper,
        protected trazaService: TrazaService,
    ) {
        super($nameParamRepository, $nameParamMapper, trazaService, true);
    }
}`;