import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from 'src/common/common.module'
import { ContactEntity } from './contact.entity'
import { ContactResolver } from './contact.resolver'
import { ContactService } from './contact.service'

@Module({
  imports: [TypeOrmModule.forFeature([ContactEntity], 'FORM')],
  providers: [ContactService, ContactResolver],
  exports: []
})
export class ContactModule {}
