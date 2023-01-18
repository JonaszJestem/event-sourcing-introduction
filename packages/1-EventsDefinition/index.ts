import { groupBy } from 'lodash'
// 1. Define your events and entity here

describe('EventsDefinitionTests', () => {
  it('should define all the event types', function () {
    const expectedEventTypesCount = 5;

    const events: any[] = [];

    expect(events).toHaveLength(expectedEventTypesCount);
    expect(groupBy(events, 'type')).toHaveLength(expectedEventTypesCount)
  });
});