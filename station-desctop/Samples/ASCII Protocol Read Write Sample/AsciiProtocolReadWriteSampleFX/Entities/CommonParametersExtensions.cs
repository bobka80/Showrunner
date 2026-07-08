//-----------------------------------------------------------------------
// <copyright file="CommonParametersExtensions.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Parameters;

    /// <summary>
    /// Extension methods for the <see cref="CommonParameters"/>
    /// </summary>
    public static class CommonParametersExtensions
    {
        /// <summary>
        /// Copy the <see cref="ITransponderParameters"/> from the source to the destination
        /// </summary>        
        /// <param name="destination">The destination to copy to</param>
        /// <param name="source">The source to copy from</param>
        public static void ApplyTransponderParametersFrom(this ITransponderParameters destination, ITransponderParameters source)
        {
            destination.IncludeChecksum = source.IncludeChecksum;
            destination.IncludeIndex = source.IncludeIndex;
            destination.IncludePC = source.IncludePC;
            destination.IncludeTransponderRssi = source.IncludeTransponderRssi;
        }

        /// <summary>
        /// Converts the int? setting to a string for persitsence in the settings
        /// </summary>
        /// <param name="value">The value to convert</param>
        /// <returns>The converted value</returns>
        public static string ToSetting(this int? value)
        {
            if (value.HasValue)
            {
                return value.ToString();
            }
            else
            {
                return string.Empty;
            }
        }

        /// <summary>
        /// Converts the TriState? setting to a string for persitsence in the settings
        /// </summary>
        /// <param name="value">The value to convert</param>
        /// <returns>The converted value</returns>
        public static string ToSetting(this TriState? value)
        {
            if (value.HasValue)
            {
                return value.Parameter();
            }
            else
            {
                return string.Empty;
            }
        }

        /// <summary>
        /// Converts the string setting to a int? rehydrated from the settings
        /// </summary>
        /// <param name="value">The value to convert</param>
        /// <returns>The converted value</returns>
        public static int? ToInt(this string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return null;
            }
            else
            {
                return int.Parse(value);
            }
        }

        /// <summary>
        /// Converts the string setting to a TriState? rehydrated from the settings
        /// </summary>
        /// <param name="value">The value to convert</param>
        /// <returns>The converted value</returns>
        public static TriState? ToTriState(this string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return null;
            }
            else
            {
                return value.ParseParameterAs<TriState>();
            }
        }

        /// <summary>
        /// Convert between types for a view model
        /// </summary>
        /// <param name="value">The source to convert from</param>
        /// <returns>The equivalent value in the appropriate type</returns>
        public static bool? ToBool(this TriState? value)
        {
            if (value.HasValue)
            {
                return value.Value == TriState.Yes;
            }
            else
            {
                return null;
            }
        }

        /// <summary>
        /// Convert between types for a view model
        /// </summary>
        /// <param name="value">The source to convert from</param>
        /// <returns>The equivalent value in the appropriate type</returns>
        public static TriState? ToTriState(this bool? value)
        {
            if (value.HasValue)
            {
                return value.Value ? TriState.Yes : TriState.No;
            }
            else
            {
                return null;
            }
        }

        /// <summary>
        /// Convert between types for a view model
        /// </summary>
        /// <param name="value">The source to convert from</param>
        /// <returns>The equivalent value in the appropriate type</returns>
        public static System.Windows.Forms.CheckState ToCheckState(this TriState? value)
        {
            if (!value.HasValue)
            {
                return System.Windows.Forms.CheckState.Indeterminate;
            }
            else if (value.Value == TriState.Yes)
            {
                return System.Windows.Forms.CheckState.Checked;
            }
            else
            {
                return System.Windows.Forms.CheckState.Unchecked;
            }
        }

        /// <summary>
        /// Convert between types for a view model
        /// </summary>
        /// <param name="value">The source to convert from</param>
        /// <returns>The equivalent value in the appropriate type</returns>
        public static TriState? ToTriState(this System.Windows.Forms.CheckState value)
        {
            if (value == System.Windows.Forms.CheckState.Indeterminate)
            {
                return null;
            }
            else if (value == System.Windows.Forms.CheckState.Checked)
            {
                return TriState.Yes;
            }
            else
            {
                return TriState.No;
            }
        }
    }
}
