import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { AuthEmailService } from './auth-email.service';

@Injectable()
export class AuthService {

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private authEmailService: AuthEmailService,
  ) {}

async register(email: string, password: string) {

const existingUser = await this.prisma.user.findUnique({
where: { email },
})

if(existingUser){
throw new BadRequestException("Email already exists")
}

const hashedPassword = await bcrypt.hash(password,10)

const user = await this.prisma.user.create({
data:{
email,
password: hashedPassword
}
})

console.log("USER CREATED:",user)

await this.prisma.student.create({
data:{
name: email,
bacType: "MATH",
bacAverage: 0,
french: 0,
english: 0,
userId: user.id
}
})

return {
message:"User created successfully",
user:{
id:user.id,
email:user.email,
role:user.role
}
}

}
  async login(email: string, password: string) {

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Please sign in with Google');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
  access_token: token,
  user: {
    id: user.id,
    email: user.email,
    role: user.role
  }
  };
}

  async googleLogin(email: string, name: string | null) {

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          password: null,
        },
      });

      await this.prisma.student.create({
        data: {
          name: name || email,
          bacType: 'MATH',
          bacAverage: 0,
          french: 0,
          english: 0,
          userId: user.id,
        },
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiresAt,
      },
    });

    try {
      await this.authEmailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      throw new InternalServerErrorException('Failed to send reset email');
    }

    return {
      message: 'Password reset link sent successfully',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });

    return {
      message: 'Password has been reset successfully',
    };
  }
}