import { date, object, string, TestConfig } from 'yup';
import moment from 'moment/moment';

type SingleTimeslotPersist = {
  // "2022-08-23"
  date: string;
  // "14:00-18:00"
  slot: string;
};
type ManyTimeslotPersist = {
  // "2022-08-23,2022-09-01"
  dates: string;
  // "14:00-18:00,17:00-23:00"
  slots: string;
};
export interface Timeslot {
  date: Date;
  slot: string;
}

const timeslotTestConfig: TestConfig<Timeslot> = {
  name: 'timeslot',
  message:
    'slot must be the (24-hour clock) time slot format, such as "07:00-18:00", and the start time not be later than the end time',
  test: validateTimeslot,
};

function validateTimeslot(value: Timeslot): boolean {
  // Note: Check if date is valid
  const date = moment(value.date, 'yyyy-MM-DD').toDate();
  if (!date) {
    return false;
  }

  const timeslotValidationRegex = /^(\d{2}:00|30)-(\d{2}:00|30)$/y;
  const matchResult = value.slot.match(timeslotValidationRegex);
  // Note: Check if slot string match format rule
  if (!matchResult || matchResult.length !== 3) {
    return false;
  }
  const startTime = moment(matchResult[1], 'HH:mm');
  const endTime = moment(matchResult[2], 'HH:mm');

  // Note: Check if start-time and end-time are satisfied by time rule
  return startTime <= endTime;
}

function transformTimeslotSingleTimeslotPersist(
  data: Timeslot,
): SingleTimeslotPersist {
  if (!validateTimeslot(data)) {
    console.error(
      `Error: timeslot transformation to single persist failed. Failed timeslot detail as ${data}`,
    );
  }

  const slots = data.slot.split('-');
  return {
    date: moment(data.date).format('yyyy-MM-DD'),
    slot: slots[0] + '-' + slots[1],
  };
}

function transformTimeslotFromSingleTimeslotPersist(
  data: SingleTimeslotPersist,
): Timeslot {
  const date = moment(data.date, 'yyyy-MM-DD').toDate();
  const timeslot: Timeslot = {
    date,
    slot: data.slot,
  };
  if (!validateTimeslot(timeslot)) {
    console.error(
      `Error: timeslot transformation from persist failed. Failed timeslot detail as ${timeslot}`,
    );
  }

  return timeslot;
}

function transformTimeslotsManyTimeslotPersist(
  data: Timeslot[],
): ManyTimeslotPersist {
  return data.reduce<ManyTimeslotPersist>(
    (result, timeslot) => {
      const curr = transformTimeslotSingleTimeslotPersist(timeslot);
      return {
        dates: result.dates === '' ? curr.date : result.dates + ',' + curr.date,
        slots: result.slots === '' ? curr.slot : result.slots + ',' + curr.slot,
      };
    },
    {
      dates: '',
      slots: '',
    },
  );
}

function transformTimeslotsFromManyTimeslotPersist(
  data: ManyTimeslotPersist,
): Timeslot[] {
  const dates = data.dates.split(',');
  const slots = data.slots.split(',');
  const timeslotTextList = dates.map<SingleTimeslotPersist>((d, i) => ({
    date: d,
    slot: slots[i],
  }));

  return timeslotTextList.map<Timeslot>(
    transformTimeslotFromSingleTimeslotPersist,
  );
}

export const timeslotUtility = {
  schema: object({
    date: date().required(),
    slot: string().required(),
  }).test(timeslotTestConfig),
  transformTimeslotSingleTimeslotPersist,
  transformTimeslotsManyTimeslotPersist,
  transformTimeslotFromSingleTimeslotPersist,
  transformTimeslotsFromManyTimeslotPersist,
};
