//-----------------------------------------------------------------------
// <copyright file="InventoryItem.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2010 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.Text;

    using TechnologySolutions.Rfid;

    /// <summary>
    /// Determines whether an InventoryItem has changed
    /// </summary>
    public enum RecordState
    {
        /// <summary>
        /// No changes since last call to AcceptChanges
        /// </summary>
        Unchanged,

        /// <summary>
        /// Created since last call to AcceptChanges
        /// </summary>
        Created,

        /// <summary>
        /// Changed since last call to AcceptChanges
        /// </summary>
        Changed
    }

    /// <summary>
    /// A transponder that has been cache in the InventoryCache. Holds the timestamps of when it was seen
    /// </summary>   
    public class InventoryItem
        : ICloneable
    {
        /// <summary>
        /// The running average of the RSSI for the transponder
        /// </summary>
        private RunningAverage rssi;

        /// <summary>
        /// Initializes a new instance of the InventoryItem class
        /// </summary>
        /// <param name="item">The item represeneted</param>
        public InventoryItem(IIdentifiedItem item)
        {
            this.Identifier = item.UniqueIdentifier;
            this.State = RecordState.Created;
            this.rssi = new RunningAverage(5);
            this.LogSeen(item);
        }

        /// <summary>
        /// Gets the transponder identifier
        /// </summary>
        public string Identifier { get; private set; }

        /// <summary>
        /// Gets the TickCount when the transponder was last seen
        /// </summary>
        public int LastSeenTickCount { get; private set; }

        /// <summary>
        /// Gets the running average RSSI for the transponder
        /// </summary>
        public int LastRssi
        {
            get
            {
                return this.rssi.Average;
            }
        }

        /// <summary>
        /// Gets the number of times the transponder has been seen
        /// </summary>
        public int Count { get; private set; }

        /// <summary>
        /// Gets the RecordState for this instance
        /// </summary>
        public RecordState State { get; private set; }

        /// <summary>
        /// Logs that this transponder was seen
        /// </summary>
        /// <param name="item">The item represeneted</param>
        public void LogSeen(IIdentifiedItem item)
        {
            this.Count += 1;
            this.LastSeenTickCount = System.Environment.TickCount;
            this.rssi.AddEntry(item.Rssi);

            if (this.State == RecordState.Unchanged)
            {
                this.State = RecordState.Changed;
            }
        }

        /// <summary>
        /// Resets the record state to unchanged
        /// </summary>
        public void AcceptChanges()
        {
            this.State = RecordState.Unchanged;
        }

        /// <summary>
        /// Returns a MemberwiseClone of this instance
        /// </summary>
        /// <returns>The MemberwiseClone</returns>
        public InventoryItem Clone()
        {
            return (InventoryItem)this.MemberwiseClone();
        }

        /// <summary>
        /// Returns a MemberwiseClone of this instance
        /// </summary>
        /// <returns>The MemberwiseClone</returns>
        object ICloneable.Clone()
        {
            return this.Clone();
        }
    }
}
