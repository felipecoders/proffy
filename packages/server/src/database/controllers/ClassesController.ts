import { Request, Response } from 'express'
import db from '../../database/connection'

import convertHourToMinites from '../../utils/convertHourToMinutes'

interface ScheduleItem {
  week_day: number
  from: string
  to: string
}

interface Filters {
  week_day: number
  subject: string
  time: string
}

class ClassesController {
  async index(request: Request<any, null, null, Filters>, response: Response) {
    const { week_day, subject, time } = request.query

    if (!week_day || !subject || !time) {
      return response.status(400).json({
        message: 'Missing filters to search classes'
      })
    }

    const timeInMinutes = convertHourToMinites(time)

    const classes = await db('classes')
      .whereExists(function () {
        this.select('class_schedules.*')
          .from('class_schedules')
          .whereRaw('`class_schedules`.`class_id` = `classes`.`id`')
          .whereRaw('`class_schedules`.`week_day` = ??', [Number(week_day)])
          .whereRaw('`class_schedules`.`from` <= ??', [timeInMinutes])
          .whereRaw('`class_schedules`.`to` > ??', [timeInMinutes])
      })
      .where('classes.subject', '=', subject)
      .join('users', 'classes.user_id', '=', 'users.id')
      .select(['classes.*', 'users.*'])

    return response.json(classes)
  }

  async create(request: Request, response: Response) {
    const { 
      name,
      avatar,
      whatsapp,
      bio,
      subject,
      cost,
      schedule
    } = request.body
  
    const transaction = await db.transaction()
  
    try {
      const insertedUsersIds = await transaction('users').insert({
        name,
        avatar,
        whatsapp,
        bio
      })
  
      const user_id = insertedUsersIds[0]
  
      const insertedClassesIds = await transaction('classes').insert({
        subject,
        cost,
        user_id
      })
  
      const class_id = insertedClassesIds[0]
  
      const classSchedule = (schedule as ScheduleItem[]).map((scheduleItem: ScheduleItem) => {
        return {
          class_id,
          week_day: scheduleItem.week_day,
          from: convertHourToMinites(scheduleItem.from),
          to: convertHourToMinites(scheduleItem.to)
        }
      })
  
      await transaction('class_schedules').insert(classSchedule)
  
      await transaction.commit()
  
      return response.status(201).send()
        
    } catch (error) {
      await transaction.rollback()
  
      return response.status(400).json({
        message: 'Unexpected error while creating new class'
      })
    }
  }
}

export default new ClassesController()
