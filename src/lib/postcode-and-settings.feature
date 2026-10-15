# Agreed behaviour, not a test. A failure here means the code is wrong —
# never edit a rule to make a build pass.

@area-settings
Feature: Your postcode and saved choices
  A postcode picks your part of the grid, but only its first half ever leaves the
  device. Your duration and postcode are remembered between visits.

  Rule: Only the outward half of a postcode is kept or sent

    Scenario Outline: Typing "<typed>"
      When I enter the postcode "<typed>"
      Then the app uses "<outward>" for the forecast

      Examples:
        | typed    | outward |
        | EH1 1AA  | EH1     |
        | eh11aa   | EH1     |
        | EH1      | EH1     |
        | sw1a 2aa | SW1A    |
        | M1 1AE   | M1      |
        | EC1A 1BB | EC1A    |

    Scenario Outline: Something that is not a postcode is not used
      When I enter the postcode "<typed>"
      Then the app does not use it

      Examples:
        | typed |
        |       |
        | hello |
        | EH    |
        | 1AA   |

  Rule: Saved choices are checked on load, and a bad one falls back to its default

    Scenario Outline: Opening the app with "<saved>" in storage
      Given storage holds '<saved>'
      When the app loads my settings
      Then the duration is <hours> hours
      And the forecast is for "<region>"

      Examples:
        | saved                           | hours | region   |
        | {"hours":4,"outcode":"EH1"}     | 4     | EH1      |
        | {"hours":1,"outcode":null}      | 1     | national |
        | {"hours":3,"outcode":"EH1 1AA"} | 3     | EH1      |
        | {"hours":5,"outcode":"EH1"}     | 2     | EH1      |
        | {"hours":"4","outcode":"EH1"}   | 2     | EH1      |
        | {"hours":4,"outcode":"hello"}   | 4     | national |
        | not json                        | 2     | national |
        |                                 | 2     | national |
