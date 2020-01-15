import { Controller, Get, Param } from '@nestjs/common';
import {CouponService } from './coupon.service';

@Controller('coupon')
export class CouponController {
    constructor(private couponService:CouponService){}

    @Get(':id')
    async getCoupon(@Param('id') id){
        const data = await this.couponService.getCoupon(id);
        return data;
    }
    @Get('/validate/:id/:companyId')
    async validateCoupon(@Param('id') id, @Param('companyId') companyId){
        const data = await this.couponService.validateCoupon(id, companyId);
        return data;
    }
    @Get('/redeem/:id')
    async redeemCoupon(@Param('id') id){
        const data = await this.couponService.redeemCoupon(id);
        return data;
    }
}
