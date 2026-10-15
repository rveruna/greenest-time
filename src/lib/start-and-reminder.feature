# Agreed behaviour, not a test. A failure here means the code is wrong —
# never edit a rule to make a build pass.

@area-reminder
Feature: When to start, and the reminder
  Once the cleanest window is found, the app says how long to wait for it and
  reminds you five minutes before it opens. Times are minutes from now.

  Rule: If the window opens within 15 minutes, the app says now is the best time

    Scenario Outline: A window opening in <minutes> minutes
      Given the cleanest window opens in <minutes> minutes
      Then the app says "<advice>"

      Examples:
        | minutes | advice               |
        | 0       | Now is the best time |
        | 10      | Now is the best time |
        | 15      | Now is the best time |

    Scenario Outline: A window opening later is given a start time instead
      Given the cleanest window opens in <minutes> minutes
      Then the app says to start later, not now

      Examples:
        | minutes |
        | 16      |
        | 90      |

  Rule: The countdown reads in hours and minutes

    Scenario Outline: Counting down to a window <minutes> minutes away
      Given the cleanest window opens in <minutes> minutes
      Then the countdown reads "<countdown>"

      Examples:
        | minutes | countdown      |
        | 20      | in 20 min      |
        | 59      | in 59 min      |
        | 60      | in 1 h         |
        | 90      | in 1 h 30 min  |
        | 120     | in 2 h         |
        | 1439    | in 23 h 59 min |

  Rule: The reminder goes off five minutes before the window opens

    Scenario Outline: A reminder for a window <minutes> minutes away
      Given the cleanest window opens in <minutes> minutes
      When I ask to be reminded
      Then the reminder goes off in <reminder> minutes

      Examples:
        | minutes | reminder |
        | 6       | 1        |
        | 90      | 85       |
        | 2880    | 2875     |

    Scenario Outline: No reminder when there are five minutes or less to go
      Given the cleanest window opens in <minutes> minutes
      When I ask to be reminded
      Then there is no reminder, because the answer is to start now

      Examples:
        | minutes |
        | 5       |
        | 3       |
        | 0       |

  Rule: On the web, the calendar file holds the window and the same five-minute alert

    Scenario: Adding a two-hour window to a calendar
      Given the cleanest window opens in 90 minutes and lasts 2 hours
      When I add it to my calendar
      Then the event runs for the whole window
      And the event alerts me 5 minutes before it starts
