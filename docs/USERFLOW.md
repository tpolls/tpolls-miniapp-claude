```mermaid
flowchart TD
    Launch[Launch MiniApp in Telegram] --> GettingStarted[Getting Started Page]
    GettingStarted --> RoleSelection[Role Selection]

    RoleSelection --> Creator[Poll Creator]
    RoleSelection --> Responder[Poll Responder]

    %% Creator Flow
    Creator --> CreatorWallet[Connect TON Wallet]
    CreatorWallet --> CreatePoll[Create Poll Form]
    CreatePoll --> FundPoll[Fund Poll with Jettons]
    FundPoll --> ManagePolls[Manage Polls Dashboard]
    ManagePolls --> ViewResults[View Results]

    %% Responder Flow
    Responder --> ResponderWallet[Connect TON Wallet]
    ResponderWallet --> LivePolls[View Live Polls]
    LivePolls --> PollDetails[Poll Details + Vote]
    PollDetails --> VoteConfirm[Confirm Response + Receive Jettons]

    %% Optional Features
    ManagePolls --> Achievements[Achievements & Badges]
    VoteConfirm --> Achievements

    ManagePolls --> Quests[Quest Page]
    VoteConfirm --> Quests

    ManagePolls --> Profile[Profile / Settings]
    VoteConfirm --> Profile
```