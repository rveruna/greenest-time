# Agreed behaviour, not a test. A failure here means the code is wrong —
# never edit a rule to make a build pass.

@area-forecast
Feature: The cleanest time to run an appliance
  The forecast comes in half-hour slots, given here as gCO2/kWh from 08:00 UTC.
  For a run of 1 to 4 hours, the app finds the cleanest window and says how much
  cleaner it is than starting now.

  Rule: The cleanest window is the consecutive run with the lowest average intensity

    Scenario Outline: The cleanest <hours>-hour run
      Given the forecast from 08:00 UTC is "<forecast>"
      When I look for the cleanest <hours>-hour window
      Then the window runs from <from> to <to> UTC
      And it averages <average> gCO2/kWh

      Examples:
        | forecast                                         | hours | from  | to    | average |
        | 200, 50, 300, 200, 60, 60, 250                   | 1     | 10:00 | 11:00 | 60      |
        | 100, 80, 90, 70, 300, 300, 300, 300              | 2     | 08:00 | 10:00 | 85      |
        | 300, 300, 300, 100, 100, 100, 100                | 2     | 09:30 | 11:30 | 100     |
        | 250, 120, 110, 100, 100, 110, 120, 250           | 3     | 08:30 | 11:30 | 110     |
        | 400, 400, 100, 100, 100, 100, 100, 100, 100, 100 | 4     | 09:00 | 13:00 | 100     |

  Rule: When two windows are equally clean, the earlier one wins, because waiting for no benefit is worse

    Scenario Outline: A tie goes to the earliest start
      Given the forecast from 08:00 UTC is "<forecast>"
      When I look for the cleanest <hours>-hour window
      Then the window runs from <from> to <to> UTC

      Examples:
        | forecast                           | hours | from  | to    |
        | 100, 100, 100, 100, 100, 100       | 1     | 08:00 | 09:00 |
        | 300, 300, 50, 50, 300, 300, 50, 50 | 1     | 09:00 | 10:00 |
        | 300, 60, 40, 300, 50, 50           | 1     | 08:30 | 09:30 |

  Rule: The window must fit inside the forecast

    Scenario Outline: A window that only just fits is still found
      Given the forecast from 08:00 UTC is "<forecast>"
      When I look for the cleanest <hours>-hour window
      Then the window runs from <from> to <to> UTC

      Examples:
        | forecast                          | hours | from  | to    |
        | 120, 110                          | 1     | 08:00 | 09:00 |
        | 120, 110, 100, 90, 80, 70, 60, 50 | 4     | 08:00 | 12:00 |
        | 300, 300, 300, 300, 50, 50        | 1     | 10:00 | 11:00 |

    Scenario Outline: A forecast too short for the run gives no window
      Given the forecast from 08:00 UTC is "<forecast>"
      When I look for the cleanest <hours>-hour window
      Then there is no window

      Examples:
        | forecast                          | hours |
        |                                   | 1     |
        | 100                               | 1     |
        | 100, 100, 100                     | 2     |
        | 100, 100, 100, 100, 100, 100, 100 | 4     |

  Rule: "Cleaner than now" compares the window with starting now, in whole percent, and is never negative

    Scenario Outline: How much cleaner the window is than starting now
      Given the forecast from 08:00 UTC is "<forecast>"
      When I look for the cleanest <hours>-hour window
      Then starting now averages <now> gCO2/kWh
      And the window is <saving>% cleaner than starting now

      Examples:
        | forecast           | hours | now | saving |
        | 200, 200, 100, 100 | 1     | 200 | 50     |
        | 300, 200, 100, 100 | 1     | 250 | 60     |
        | 150, 150, 100, 100 | 1     | 150 | 33     |
        | 100, 100, 100, 100 | 1     | 100 | 0      |
        | 50, 50, 100, 100   | 1     | 50  | 0      |
        | 0, 0, 0, 0         | 1     | 0   | 0      |

  Rule: When the whole forecast stays within 10 gCO2/kWh, the app says any time will do instead of picking a start

    Scenario Outline: A forecast with nothing to wait for
      Given the forecast from 08:00 UTC is "<forecast>"
      When I look for the cleanest <hours>-hour window
      Then the app says <answer>

      Examples:
        | forecast                | hours | answer               |
        | 0, 0, 0, 0              | 1     | any time will do     |
        | 100, 105, 110, 100      | 1     | any time will do     |
        | 100, 111, 100, 100      | 1     | when to start        |
        | 300, 300, 50, 50        | 1     | when to start        |
