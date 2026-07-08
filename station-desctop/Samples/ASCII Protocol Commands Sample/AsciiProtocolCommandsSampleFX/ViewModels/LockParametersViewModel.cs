//-----------------------------------------------------------------------
// <copyright file="LockParametersViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using TechnologySolutions.ModelViewViewModel.ViewModels;
    using TechnologySolutions.Rfid.AsciiProtocol;

    /// <summary>
    /// Container for the lock payload parameters
    /// </summary>
    public class LockParametersViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for all parameters
        /// </summary>
        private LockPayload lockPayload = new LockPayload();

        /// <summary>
        /// Gets or sets the payload as used by the lock command
        /// </summary>
        public int Payload
        {
            get
            {
                return this.lockPayload.Payload;
            }

            set
            {
                if (this.lockPayload.Payload != value)
                {
                    LockPayload temp = new LockPayload(value);

                    // fire appropriate property changes
                    this.AccessPasswordRestriction = temp.AccessPasswordRestriction;
                    this.EpcMemoryBankRestriction = temp.EpcMemoryBankRestriction;
                    this.KillPasswordRestriction = temp.KillPasswordRestriction;
                    this.TidMemoryBankRestriction = temp.TidMemoryBankRestriction;
                    this.UserMemoryBankRestriction = temp.UserMemoryBankRestriction;
                    this.OnPropertyChanged("Payload");
                }
            }
        }

        /// <summary>
        /// Gets the available <see cref="MemoryBankRestriction"/>s
        /// </summary>
        public ICollection<MemoryBankRestriction> MemoryBankRestrictions
        {
            get
            {
                return (MemoryBankRestriction[])Enum.GetValues(typeof(MemoryBankRestriction));
            }
        }

        /// <summary>
        /// Gets the available <see cref="PasswordRestriction"/>s
        /// </summary>
        public ICollection<PasswordRestriction> PasswordRestrictions
        {
            get
            {
                return (PasswordRestriction[])Enum.GetValues(typeof(PasswordRestriction));
            }
        }

        /// <summary>
        /// Gets or sets the restrictions for the Access password
        /// </summary>
        public PasswordRestriction AccessPasswordRestriction
        {
            get
            {
                return this.lockPayload.AccessPasswordRestriction;
            }

            set
            {
                if (this.lockPayload.AccessPasswordRestriction != value)
                {
                    this.lockPayload.AccessPasswordRestriction = value;
                    this.OnPropertyChanged("AccessPasswordRestriction");
                }
            }
        }

        /// <summary>
        /// Gets or sets the restrictions for the EPC memory bank
        /// </summary>
        public MemoryBankRestriction EpcMemoryBankRestriction
        {
            get
            {
                return this.lockPayload.EpcMemoryBankRestriction;
            }

            set
            {
                if (this.lockPayload.EpcMemoryBankRestriction != value)
                {
                    this.lockPayload.EpcMemoryBankRestriction = value;
                    this.OnPropertyChanged("EpcMemoryBankRestriction");
                }
            }
        }

        /// <summary>
        /// Gets or sets the restrictions for the kill password
        /// </summary>
        public PasswordRestriction KillPasswordRestriction
        {
            get
            {
                return this.lockPayload.KillPasswordRestriction;
            }

            set
            {
                if (this.lockPayload.KillPasswordRestriction != value)
                {
                    this.lockPayload.KillPasswordRestriction = value;
                    this.OnPropertyChanged("KillPasswordRestriction");
                }
            }
        }

        /// <summary>
        /// Gets or sets the restrictions for the TID memory bank
        /// </summary>
        public MemoryBankRestriction TidMemoryBankRestriction
        {
            get
            {
                return this.lockPayload.TidMemoryBankRestriction;
            }

            set
            {
                if (this.lockPayload.TidMemoryBankRestriction != value)
                {
                    this.lockPayload.TidMemoryBankRestriction = value;
                    this.OnPropertyChanged("TidMemoryBankRestriction");
                }
            }
        }

        /// <summary>
        /// Gets or sets the restrictions for the user memory bank
        /// </summary>
        public MemoryBankRestriction UserMemoryBankRestriction
        {
            get
            {
                return this.lockPayload.UserMemoryBankRestriction;
            }

            set
            {
                if (this.lockPayload.UserMemoryBankRestriction != value)
                {
                    this.lockPayload.UserMemoryBankRestriction = value;
                    this.OnPropertyChanged("UserMemoryBankRestriction");
                }
            }
        }
    }
}
