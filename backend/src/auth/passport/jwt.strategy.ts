import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ignoreElements } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { IUser } from 'src/users/users.interface';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private rolesService: RolesService,
    ) {
        super({
            //get token from header and decode 
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

            // ignoreElements: false,
            //dont need keyword this
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        });
    }

    //if token valid return data of user 
    async validate(payload: IUser) {
        const { _id, name, email, role } = payload;
        const userRole = role as unknown as { _id: string; name: string }
        const temp = (await this.rolesService.findOne(userRole._id)).toObject();
        return {
            _id,
            name,
            email,
            role,
        };
    }

}
